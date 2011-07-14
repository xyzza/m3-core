#coding: utf-8
'''
Created on 26.05.2011

@author: prefer
'''
from abc import ABCMeta, abstractmethod
from sqlalchemy.sql.expression import join, select, _BinaryExpression
from sqlalchemy import bindparam
from sqlalchemy import func

from m3.helpers.datastructures import TypedList
from m3.db.alchemy_wrapper import SQLAlchemyWrapper
from m3.contrib.m3_query_builder import EntityCache

from django.conf import settings
from django.db.models.loading import cache
from django.db.models.fields import AutoField

#========================== КОНСТАНТЫ ============================
WRAPPER = SQLAlchemyWrapper(settings.DATABASES)

#========================== ИСКЛЮЧЕНИЯ ===========================
class EntityException(Exception):
    """ Базовое исключение для всех сущностей запросов """
    pass


class DjangoModelNotFound(EntityException):
    def __init__(self, model_name, *a, **k):
        super(DjangoModelNotFound, self).__init__(self, *a, **k)
        self.model_name = model_name
        
    def __str__(self):
        return u'В кэше моделей Django не удалось найти модель по имени %s ' % self.model_name


class DBTableNotFound(EntityException):
    def __init__(self, model_name, *a, **k):
        super(DBTableNotFound, self).__init__(self, *a, **k)
        self.model_name = model_name
        
    def __str__(self):
        return u'SqlAlchemy не удалось определить таблицу БД для модели Django с именем %s' % self.model_name


class EntityNotFound(EntityException):
    def __init__(self, entity_name, *a, **k):
        super(EntityNotFound, self).__init__(self, *a, **k)
        self.entity_name = entity_name
        
    def __str__(self):
        return u'Не удалось найти Entity с именем %s' % self.entity_name


class DBColumnNotFound(EntityException):
    def __init__(self, model_name, field_name, *a, **k):
        super(DBColumnNotFound, self).__init__(self, *a, **k)
        self.model_name = model_name
        self.field_name = field_name
        
    def __str__(self):
        raise Exception(u'В модели %s не найдена колонка %s' % (self.model_name, self.field_name))
        

#=========================== КЛАССЫ ==============================
class Relation(object):
    '''
    Связь между сущностями
    '''
    def __init__(self, field_first, field_second,
                  outer_first=False, outer_second=False):
        '''
        @param field_first: Первое поле
        @param outer_first: Тип связи, внешняя, или внутренняя. True - внешняя
        
        @param field_second: Второе поле
        @param outer_second: Тип связи, внешняя, или внутренняя. True - внешняя 
        '''
        assert isinstance(field_first, Field), '"field_first" must be "Field" type'
        assert isinstance(field_second, Field), '"field_first" must be "Field" type'
                
        self.field_first = field_first        
        self.outer_first = outer_first
        
        self.field_second = field_second        
        self.outer_second = outer_second
        

class Table(object):
    '''
    Для обозначения таблиц в схемах
    '''        
    def __init__(self, name, alias=None, verbose_name=None):
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name


class BaseAlchemyObject(object):
    __metaclass__ = ABCMeta
    __instance_cache = {}

    def __init__(self, name, alias=None, verbose_name=None):
        assert isinstance(name, basestring)
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name

        c = self.__instance_cache.get(self.name)
        if c:
            self.__dict__ = c.__dict__
        else:
            self.table = self._get_alchemy_table()
            self.aliased_table = self.table.alias(self.alias)
            self.__instance_cache[self.name] = self

    @abstractmethod
    def _get_alchemy_table(self):
        """ Возвращает таблицу в формате SqlAlchemy """

    @abstractmethod
    def get_alchemy_field(self, field_name, field_alias=''):
        """ Возвращает поле таблицы в формате SqlAlchemy """

    @abstractmethod
    def get_fields(self):
        """ Возвращает колонки в формате Entity """

    def get_subquery(self):
        return self.aliased_table


class Model(BaseAlchemyObject):
    '''
    Для обозначения моделей в схемах
    '''
    def __init__(self, name, alias=None, verbose_name=None):
        super(Model, self).__init__(name, alias, verbose_name)

    def _get_django_model(self):
        """ Возвращает модель Django по имени """
        app, model = self.name.split('.')
        model = cache.get_model(app, model)
        if not model:
            raise DjangoModelNotFound(model_name=self.name)
        return model
    
    def _get_alchemy_table(self):
        model = self._get_django_model()
        table_name = model._meta.db_table
        table = WRAPPER.metadata.tables.get(table_name)
        if table is None:
            raise DBTableNotFound(model_name=table_name)
        return table
    
    def get_alchemy_field(self, field_name, field_alias=''):
        model = self._get_django_model()
        
        field = model._meta.get_field(field_name)
        field_real_name = field.get_attname()
        column = self.aliased_table.columns.get(field_real_name)
        if column is None:
            raise DBColumnNotFound(field_name, field_real_name)

        if field_alias:
            column = column.label(field_alias)

        return column
        
    def get_fields(self):
        """ Возвращает колонки в формате Entity """
        model = self._get_django_model()
        fields = []
        for lf in model._meta.local_fields:
            # Django может подсунуть прокси из functools вместо строки
            verbose_name = lf.verbose_name if isinstance(lf.verbose_name, basestring) else ''
            
            if isinstance(lf, AutoField):
                verbose_name = ''
           
            new_field = Field(
                entity = self,
                field_name = lf.attname, 
                verbose_name = verbose_name)

            fields.append(new_field)
        return fields
        

class Entity(BaseAlchemyObject):
    '''
    Для обозначения сущности в схемах.
    Опа! А почему у нас две энтити?
    '''
    def __init__(self, name, alias=None, verbose_name=None):
        super(Entity, self).__init__(name, alias, verbose_name)

    def _get_alchemy_table(self):
        entity = EntityCache.get_entity(self.name)
        if entity is None:
            raise EntityNotFound(self.name)

        e = entity()
        query = e.create_query()
        
        if self.alias:
            query = query.label(self.alias)
        
        return query
    
    def get_alchemy_field(self, field_name, field_alias=''):
        column = self.aliased_table.columns[field_name]
        if field_alias:
            column = column.label(field_alias)

        return column
    
    def get_fields(self):
        entity = EntityCache.get_entity(self.name)
        if entity is None:
            raise EntityNotFound(entity_name=self.name)

        fields = []
        for f in entity().select:
            if f.field_name == Field.ALL_FIELDS:
                flist = f.entity.get_fields()
                fields.extend(flist)

            else:
                fields.append(f)

        return fields

class Field(object):
    '''
    Для обозначения поля
    '''
    
    # Все поля
    ALL_FIELDS = '*'
    
    def __init__(self, entity, field_name, alias=None, verbose_name=''):
        assert isinstance(entity, (Model, Entity))
        self.entity = entity
        self.field_name = field_name
        self.alias = alias
        self.verbose_name = verbose_name
    
    def get_alchemy_field(self):
        """ Возвращает поле в формате SqlAlchemy """
        field = self.entity.get_alchemy_field(self.field_name, self.alias)
        return field


class Aggregate(object):
    '''
    Набор классов для агригирования
    '''
    class BaseAggregate(object):
        def __init__(self, field):
            assert isinstance(field, Field), '"field" must be "Field" type'
            self.field = field

        def get_alchemy_func(self, column):
            raise NotImplementedError

    class Max(BaseAggregate):
        def get_alchemy_func(self, column):
            return func.max(column)
            
    class Min(BaseAggregate):
        def get_alchemy_func(self, column):
            return func.min(column)
            
    class Count(BaseAggregate):
        def get_alchemy_func(self, column):
            return func.count(column)

class Where(object):
    '''
    Для условий
    '''
    
    AND = 'and'
    OR = 'or'
    NOT = 'not'
    
    EQ = '='
    NE = '!='
    LT = '<'
    LE = '<='
    GT = '>'
    GE = '>='
    
    IN = 'Вхождение'
    
    # TODO: Пока не используется оператор between
    BETWEEN = 'between'
    
    def __init__(self, left=None, op=None, right=None):
        '''
        @param left: Левый операнд
        @param op: Оператор (=, !=, <, >, <=, >=, ...)
        @param right: Правый операнд
        '''
        self.left = left
        self.operator = op
        self.right = right
    
    def __and__(self, other):
        assert isinstance(other, Where), 'Value must be type is "Where"'
        return Where(self, Where.AND, other)
    
    def __or__(self, other):
        assert isinstance(other, Where), 'Value must be type is "Where"'
        return Where(self, Where.OR, other)
        
    def __invert__(self):
        return Where(self, Where.NOT)
    
    def is_empty(self):
        return self.left is None and self.right is None
        
    @staticmethod
    def get_simple_conditions():
        return {
                'eq': Where.EQ,
                'ne': Where.NE,
                'lt': Where.LT,
                'le': Where.LE,
                'gt': Where.GT,
                'ge': Where.GE,
                'in': Where.IN,
                }

class Grouping(object):
    '''
    Для группировки
    '''

    MIN = u'Минимум'
    MAX = u'Максимум'
    COUNT = u'Количество'

    def __init__(self, group_fields, aggregate_fields):
        self.group_fields = group_fields
        self.aggregate_fields = aggregate_fields
        
    @staticmethod
    def get_aggr_functions():
        return {
                Grouping.MIN: Aggregate.Min,
                Grouping.MAX: Aggregate.Max,
                Grouping.COUNT: Aggregate.Count,                
                }


class BaseEntity(object):
    '''
    Базовый класс для сущностей/схемы/прокси/view - кому как удобно
    В дальнейшем будем употреблять "сущность"
    ps: view в контексте бд
    '''

    # Карта для перевода операций конструктора запросов в алхимию
    OPERATION_MAP = {
        Where.EQ: lambda x, y: x == y,
        Where.NE: lambda x, y: x != y,
        Where.LT: lambda x, y: x < y,
        Where.LE: lambda x, y: x <= y,
        Where.GT: lambda x, y: x > y,
        Where.GE: lambda x, y: x >= y, 
        Where.AND: lambda x, y: x & y,
        Where.OR: lambda x, y: x | y,
        Where.NOT: lambda x, y: ~x,
        Where.IN: lambda x, y: x.in_([y]),
        Where.BETWEEN: lambda x, y: x.between(y[0], y[1]),
    }
    
    def __init__(self):
        # Имя сущности
        self.name = ''

        # Список объектов (модели, сущности, имена таблиц), используемых во текущей
        # сущности.
        self.entities = []

        # Типизированный список связей, над вышеупомянутами объектами
        self.relations = TypedList(type=Relation)

        # Список полей, по которым нужно проводить группировку
        self.group_by = None

        # Объект условий
        self.where = None

        # Словарь с алиасами для полей в select'e запроса
        self.select = TypedList(type=Field)

        # Выводить повторяющиеся записи?
        self.distinct = None

        # Количество показываемых записей
        self.limit = 0

        # Смещение от начала выборки
        self.offset = 0

        self.metadata = WRAPPER.metadata
        self.session = WRAPPER.session

    def _get_field_real_name(self, model_full_name, column_name):
        """ 
        Возвращает реальное имя поля в БД 
        по имени колонки column_name в модели model_name 
        """
        app_name, model_name = model_full_name.split('.')
        model = cache.get_model(app_name, model_name)
        if not model:
            raise DjangoModelNotFound(model_name=model_full_name)
        
        field = model._meta.get_field(column_name)
        return field.get_attname()
    
    def create_query(self):
        """ Возвращает готовый запрос алхимии по параметрам Entity """       
        
        # Подготовка колонок для выбора SELECT
        if not len(self.select):
            raise Exception(u'Нет данных для SELECT')
        
        select_columns = []
        for field in self.select:
            assert isinstance(field, Field)

            if field.field_name == Field.ALL_FIELDS:
                # Все поля
                table = field.entity.get_subquery()
                select_columns.append(table)
            else:
                # Отдельное поле.
                column = field.get_alchemy_field()

                # На наго может быть наложена агрегатная функция.
                if self.group_by and self.group_by.aggregate_fields:
                    aggregate_fields = self.group_by.aggregate_fields
                    for af in aggregate_fields:
                        if af.field.field_name == field.field_name:
                            column = af.get_alchemy_func(column)
                            break

                select_columns.append(column)

        # Подготовка объединений JOIN. Важна последовательность!
        join_sequence = None
        last_column = None
        for rel in self.relations:
            assert isinstance(rel, Relation)           

            left_column = rel.field_first.get_alchemy_field()
            right_column = rel.field_second.get_alchemy_field()
            
            if join_sequence is None:
                last_column = right_column
                
                onclause = (left_column == right_column) # _BinaryExpression
                join_sequence = join(left_column.table, right_column.table, onclause)

            else:
                assert left_column.table == last_column.table
                
                onclause = (last_column == right_column) # _BinaryExpression
                join_sequence = join_sequence.join(right_column.table, onclause)
        
        join_sequence = None if join_sequence is None else [join_sequence]
                
        # Условия WHERE
        whereclause = self._create_where_expression(self.where)

        query = select(columns=select_columns, whereclause=whereclause, from_obj=join_sequence)

        # Группировка GROUP BY
        if self.group_by and self.group_by.group_fields:
            for field in self.group_by.group_fields:
                col = field.get_alchemy_field()
                query = query.group_by(col)

        # LIMIT и OFFSET
        if self.limit > 0:
            query = query.limit(self.limit)
        if self.offset > 0:
            query = query.offset(self.offset)

        return query

    def get_select_fields(self):
        """ Возвращает список всех полей entity.Field из SELECT """
        fields = []
        for field in self.select:
            assert isinstance(field, Field), '"field" must be "Field" type'
            field_name = field.field_name
            
            # Все поля
            if field_name == Field.ALL_FIELDS:
                ff = field.entity.get_fields()
                fields.extend(ff)
            
            # Отдельное поле
            else:       
                fields.append(field)
        
        return fields

    def _create_where_expression(self, where):
        """ Преобразует выражение Where в логическое условие алхимии """
        # Пустые условия пропускаем
        if where is None or where.is_empty():
            return

        # Если условие составное, то обрабатываем его рекурсивно
        left, right = where.left, where.right
        if isinstance(where.left, Where):
            left = self._create_where_expression(left)
        if isinstance(where.right, Where):
            right = self._create_where_expression(right)

        # Если отсутствует одна из частей условия, то возвращаем существующую
        if left is None and right is not None:
            return right
        elif left is not None and right is None:
            return left

        # Если часть условия не является готовым выражением алхимии,
        # то преобразуем его в поле или параметр запроса
        if not isinstance(left, _BinaryExpression):
            if isinstance(left, Field):
                left = left.get_alchemy_field()
            elif isinstance(left, basestring) and left.startswith('$'):
                left = bindparam(left, required=True)
            else:
                raise TypeError('Left WHERE argument must be string parameter or Field instance')

        if not isinstance(right, _BinaryExpression):
            if isinstance(right, Field):
                right = right.get_alchemy_field()
            elif isinstance(right, basestring):
                right = bindparam(right, required=True)
            else:
                raise TypeError('Right WHERE argument must be string parameter or Field instance')
        
        func = self.OPERATION_MAP.get(where.operator)
        if not func:
            raise NotImplementedError(u'Логическая операция "%s" не реализована в WHERE' % where.operator)
        
        # Отвадивает тут! Потому что нужны параметры!
        exp = func(left, right)
        return exp
    
    def get_raw_sql(self):
        """ Возвращает текст SQL запроса для Entity """
        return str(self.create_query())

    def get_data(self, params=None):
        """ Возвращает данные, полученные в результатет выполнения запроса """
        query = self.create_query()
        cursor = query.execute(params)
        data = cursor.fetchall()
        return data    

#TODO: Проблема с IN, он преобразуется в ARRAY, но PostgreSQL почему-то не понимает его
#TODO: В get_data() надо использовать params чтобы определить,
#      использовать в == или IN в Where, в зависимости от типа аргумента