#coding: utf-8
'''
Created on 26.05.2011

@author: prefer
'''
from abc import ABCMeta, abstractmethod
from sqlalchemy.sql.expression import join, select, ColumnElement
from sqlalchemy import bindparam
from sqlalchemy import func as func_generator

from m3.helpers.datastructures import TypedList
from m3.db.alchemy_wrapper import SQLAlchemyWrapper
from m3.contrib.m3_query_builder import EntityCache

from django.conf import settings
from django.db.models.loading import cache
from django.db.models.fields import AutoField

sqlparse = None
try:
    import sqlparse
except ImportError:
    pass

#========================== КОНСТАНТЫ ============================
# автодокументация в сфинксе почему то не видит SQLAlchemyWrapper
try:
    WRAPPER = SQLAlchemyWrapper(settings.DATABASES)
except:
    pass

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
        return u'В модели %s не найдена колонка %s' % (self.model_name, self.field_name)
    
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


class BaseAlchemyObject(object):
    __metaclass__ = ABCMeta
    _instance_cache = {}

    def __init__(self, name, alias=None, verbose_name=None):
        assert isinstance(name, basestring)
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name
        self._aliased_table = None

        c = self._instance_cache.get(self.name)
        if c:
            self.__dict__ = c.__dict__
        else:
            self._instance_cache[self.name] = self

    @classmethod
    def clear_instances(cls):
        for v in cls._instance_cache.values():
            v._aliased_table = None

    @abstractmethod
    def _get_alchemy_table(self, params):
        """ Возвращает таблицу в формате SqlAlchemy """

    @abstractmethod
    def get_alchemy_field(self, field_name, params, field_alias=''):
        """ Возвращает поле таблицы в формате SqlAlchemy """

    @abstractmethod
    def get_fields(self):
        """ Возвращает колонки в формате Entity """

    def get_subquery(self, params):
        """
        Возвращает подзапрос с алиасом. Параметры params передаются
        чтобы модифицировать запрос в зависимости от данных
        """
        if self._aliased_table is None:
            table = self._get_alchemy_table(params)
            self._aliased_table = table.alias(self.alias)
        return self._aliased_table

#===============================================================================
#
# Описание конструкций, которые используются для декларативного описания
# сущностей
#
#===============================================================================

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
    
    def _get_alchemy_table(self, params):
        model = self._get_django_model()
        table_name = model._meta.db_table
        table = WRAPPER.metadata.tables.get(table_name)
        if table is None:
            raise DBTableNotFound(model_name=table_name)
        return table
    
    def get_alchemy_field(self, field_name, params, field_alias=''):
        model = self._get_django_model()
        
        field = model._meta.get_field(field_name)
        field_real_name = field.get_attname()
        column = self.get_subquery(params=params).columns.get(field_real_name)
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

    def _get_alchemy_table(self, params):
        entity = EntityCache.get_entity(self.name)
        if entity is None:
            raise EntityNotFound(self.name)

        e = entity()
        query = e.create_query(params=params)
        
        if self.alias:
            query = query.label(self.alias)
        
        return query
    
    def get_alchemy_field(self, field_name, params, field_alias=''):
        column = self.get_subquery(params).columns[field_name]
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
    
    def get_alchemy_field(self, params):
        """
        Возвращает поле в формате SqlAlchemy.
        Пробрасывает вызов той сущности, с которой само работает.
        """
        field = self.entity.get_alchemy_field(field_name=self.field_name, params=params, field_alias=self.alias)
        return field
    
    def get_full_field_name(self, separator='-'):
        '''
        Возвращает через разделитель наименование сущности и наименование поля
        '''
        return separator.join([self.entity.name, self.field_name])


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
            return func_generator.max(column)
            
    class Min(BaseAggregate):
        def get_alchemy_func(self, column):
            return func_generator.min(column)
            
    class Count(BaseAggregate):
        def get_alchemy_func(self, column):
            return func_generator.count(column)

class SortOrder(object):
    '''
    Для сортировки
    '''
    
    ASC = u'По возврастанию'
    DESC = u'По убыванию'
    
    VALUES = [ASC, DESC]
    
    def __init__(self, field, order=None):
        order = order or SortOrder.ASC
        
        assert isinstance(field, Field)
        assert order in (SortOrder.ASC, SortOrder.DESC)
        
        self.field = field
        self.order = order

class Where(object):
    '''
    Для условий
    '''
    
    AND = 'and'
    OR = 'or'
    NOT = 'not'

    # Внимание! Тут нет условия IN потому, что в случае передачи списка алхимия его поймет
    EQ = u'= (Вхождение)'
    NE = u'!= (Не вхождение)'
    LT = '<'
    LE = '<='
    GT = '>'
    GE = '>='
    
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
        """ Возвращает истину, если условие пустое """
        return self.left is None and self.right is None

    def get_parameters(self, ent_ins):
        """ Возвращает список с именами параметров участвующих в условии """
        assert isinstance(ent_ins, BaseEntity)
        if self.is_empty():
            return []

        all_params = []

        def process_part(part):
            if isinstance(part, Param):
                part.bind_to_entity(ent_ins)
                all_params.append(part)
            elif isinstance(part, Where):
                all_params.extend( part.get_parameters(ent_ins) )

        process_part(self.left)
        process_part(self.right)
            
        return all_params
        
    @staticmethod
    def get_simple_conditions():
        return {
                'eq': Where.EQ,
                'ne': Where.NE,
                'lt': Where.LT,
                'le': Where.LE,
                'gt': Where.GT,
                'ge': Where.GE,
                #'in': Where.IN, -- используется пользовательский выбор
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

class Param(object):
    '''
    Параметр в условии Where
    '''
    
    STRING = 1
    NUMBER = 2    
    DICTIONARY =3
    DATE = 4
    BOOLEAN = 5
    COMBO = 6
    
    VALUES = {
        STRING: u'Текст',
        NUMBER: u'Число',
        DICTIONARY: u'Выбор из справочника',
        COMBO: u'Выбор из списка значений',
        DATE: u'Дата',
        BOOLEAN: u'Флаг',
    }
    
    def __init__(self, name, verbose_name, type, type_value=None):
        if type:
            assert type in Param.VALUES.keys(), 'type must be value in Param.VALUES'
        
        # Название параметра: Имя класса + '.' + Имя параметра
        self.name = name
        
        # Человеческое название параметра
        self.verbose_name = verbose_name
        
        # Тип параметра
        self.type = type
        
        # Значение типа, например если тип - выбор из справочника, значением
        # Будет являться название пака, к которому выбор из справочника
        # должен быть привязан
        self.type_value = type_value
        
    def bind_to_entity(self, ent):
        """
        Чтобы имена параметров не пересекались, во время формирования запроса
        к имени параметра добавляется имя класса
        """
        assert isinstance(ent, BaseEntity)
        if self.name.find('.') == -1:
            self.name = '%s.%s' % (ent.__class__.__name__, self.name)

    @staticmethod
    def get_type_choices():
        return [ (k, v) for k, v in Param.VALUES.items()]

#===============================================================================
#
# Описание базовой сущности, от которой в проектах наследуются реальные, 
# декларативно описываемые
#
#===============================================================================
class BaseEntity(object):
    '''
    Базовый класс для сущностей/схемы/прокси/view - кому как удобно
    В дальнейшем будем употреблять "сущность"
    ps: view в контексте бд
    '''

    # Использовать при выводе линеный список без полей
    USE_LIST_RESULT = 0
        
    # Использовать при выводе объект, привязанный к полям
    USE_DICT_RESULT = 1    

    TYPE_RESULT = {
        USE_LIST_RESULT: u'Выводить данные как линейный список',
        USE_DICT_RESULT: u'Выводить данные как объект с полями'
    }


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
        Where.BETWEEN: lambda x, y: x.between(y[0], y[1]),
    }
    
    class MultipleResultException(EntityException):
        '''
        Генерируется, когда указан флаг EntityBase.USE_DICT_RESULT и возвращено 
        несколько записей
        '''
        pass
    
    class NotFoundResultException(EntityException):
        '''
        Генерируется, когда указан флаг EntityBase.USE_DICT_RESULT и записей не возвращено
        '''
        pass
    
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
        
        # Список объектов SortOrder
        self.order_by = TypedList(type=SortOrder)

        # Список объектов Field
        self.select = TypedList(type=Field)

        # Выводить повторяющиеся записи?
        self.distinct = None

        # Количество показываемых записей
        self.limit = 0

        # Смещение от начала выборки
        self.offset = 0

        self.metadata = WRAPPER.metadata
        self.session = WRAPPER.session
        
        # По-умолчанию данные будут представлены как список
        self.result_type = BaseEntity.USE_LIST_RESULT

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
    
    def create_query(self, params=None, first_head=False):
        """ Возвращает готовый запрос алхимии по параметрам Entity """
        
        # Подготовка колонок для выбора SELECT
        if not len(self.select):
            raise EntityException(u'Нет данных для SELECT')

        select_columns = self._create_columns(params)
        join_sequence = self._create_join(params)
        whereclause = self._create_where_expression(self.where, params, first_head)

        query = select(columns=select_columns, whereclause=whereclause, from_obj=join_sequence)

        query = self._create_grouping(query, params)
        query = self._create_sorting(query, params)
        query = self._create_limit_offset(query, params, first_head)

        return query

    #TODO: Не нравятся мне эти аргументы...
    def _prepare_aggregate_for_field(self, field, column):
        """
        Если обёрнуто аггрегирующую в функцию, то метод возвращает эту функцию,
        иначе возвращает не измененное поле
        """
        if self.group_by and self.group_by.aggregate_fields:
            aggregate_fields = self.group_by.aggregate_fields
            for af in aggregate_fields:
                if af.field.field_name == field.field_name:
                    column = af.get_alchemy_func(column)
                    break
        return column

    def _create_columns(self, params):
        select_columns = []
        for field in self.select:
            assert isinstance(field, Field)

            if field.field_name == Field.ALL_FIELDS:
                # Все поля
                table = field.entity.get_subquery(params)
                select_columns.append(table)
            else:
                # Отдельное поле.
                column = field.get_alchemy_field(params)

                # На наго может быть наложена агрегатная функция.
                column = self._prepare_aggregate_for_field(field, column)

                select_columns.append(column)
        return select_columns

    def _create_join(self, params):
        """
        Подготовка объединений JOIN. Важна последовательность!
        """
        join_sequence = None
        last_column = None
        for rel in self.relations:
            assert isinstance(rel, Relation)

            left_column = rel.field_first.get_alchemy_field(params)
            right_column = rel.field_second.get_alchemy_field(params)

            if join_sequence is None:
                last_column = right_column

                onclause = (left_column == right_column) # _BinaryExpression
                join_sequence = join(left_column.table, right_column.table, onclause)

            else:
                assert left_column.table == last_column.table

                onclause = (left_column == right_column) # _BinaryExpression
                join_sequence = join_sequence.join(right_column.table, onclause)

        join_sequence = None if join_sequence is None else [join_sequence]
        return join_sequence

    def _create_grouping(self, query, params):
        """
        Добавляет в запрос алхимии конструкцию GROUP BY
        """
        if self.group_by and self.group_by.group_fields:
            for field in self.group_by.group_fields:
                col = field.get_alchemy_field(params)
                query = query.group_by(col)
        return query

    def _create_sorting(self, query, params):
        """
        Добавляет в запрос алхимии конструкцию ORDER BY
        """
        sorted_fields = []
        for sort_order in self.order_by:
            field, order = sort_order.field, sort_order.order
            column = field.get_alchemy_field(params)
            column = self._prepare_aggregate_for_field(field, column)

            # Добавляем сортировочные функции
            if order == SortOrder.ASC:
                column = column.asc()
            elif order == SortOrder.DESC:
                column = column.desc()

            sorted_fields.append(column)

        return query.order_by(*sorted_fields)


    def _create_limit_offset(self, query, params, first_head):
        """
        Добавляет в запрос алхимии срез по LIMIT и OFFSET. Из-за того, что эти операторы не
        поддердивают работу с параметрами, приходится подставлять их напрямую в запрос, если
        текущий проход является генеративным.
        """
        limit_value = 0
        offset_value = 0

        if params and isinstance(params, dict):
            class_name = self.__class__.__name__ + '.'
            if first_head:
                limit_value = self._get_param(params, 'limit', 0)
                offset_value = self._get_param(params, 'offset', 0)
            else:
                limit_value = self._get_param(params, class_name + 'limit', 0)
                offset_value = self._get_param(params, class_name + 'offset', 0)

        # Пробуем получить предустановленные значения
        if not limit_value and isinstance(self.limit, int) and self.limit > 0:
            limit_value = self.limit

        if not offset_value and isinstance(self.offset, int) and self.offset > 0:
            offset_value = self.offset

        # Установка значений
        if limit_value > 0:
            query = query.limit(limit_value)

        if offset_value > 0:
            query = query.offset(offset_value)

        return query

    def _is_param_empty(self, value):
        """
        Из-за особой хитрости передаваемых параметров это делается не очевидно.
        Возвращает истину, если значение параметра пустое.
        """
        if value is None:
            return True
        if isinstance(value, (tuple, list)) and not len(value):
            return True
        return False

    def _get_param(self, params, key, default=None, single=True):
        value = params.get(key)
        if not self._is_param_empty(value):
            if single and isinstance(value, (list, tuple)):
                return value[0]
            return value
        return default

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

    def _get_func_by_operator(self, operator):
        """ Возвращает функцию соответствующую логической операции """
        func = self.OPERATION_MAP.get(operator)
        if not func:
            raise NotImplementedError(u'Логическая операция "%s" не реализована в WHERE' % operator)
        return func

    def _create_where_expression(self, where, params, first_head):
        """ Преобразует выражение Where в логическое условие алхимии """
        # Пустые условия пропускаем
        if where is None or where.is_empty():
            return

        # Если условие составное, то обрабатываем его рекурсивно
        left, right = where.left, where.right
        if isinstance(where.left, Where):
            left = self._create_where_expression(left, params, first_head)
        if isinstance(where.right, Where):
            right = self._create_where_expression(right, params, first_head)

        # Если отсутствует одна из частей условия, то возвращаем существующую
        if left is None and right is not None:
            return right
        elif left is not None and right is None:
            return left
        elif left is None and right is None:
            return

        func = self._get_func_by_operator(where.operator)

        # Выясняем, кто у нас параметр, а кто поле
        def give_me_some_class(class_, iterable):
            has_one  = False
            for x in iterable:
                if not isinstance(left, ColumnElement):
                    has_one = True
                    if isinstance(x, class_):
                        return x
            if has_one:
                raise TypeError('WHERE argument must be string a Param or a Field instance')

        part_param = give_me_some_class(Param, [left, right])
        part_field = give_me_some_class(Field, [left, right])

        # Текущий узел WHERE не содержит ни поля ни параметра,
        # значит он объединяет 2 логических условия. Разбор параметров не требется.
        if part_param is None and part_field is None:
            return func(left, right)

        left = part_field.get_alchemy_field(params)

        if first_head:
            part_param.name = part_field.entity.name + '.' + part_param.name
        else:
            part_param.bind_to_entity(self)

        right = bindparam(part_param.name, required=True)

        if part_param and isinstance(params, dict):
            value = params.get(part_param.name)

            # Если параметры заданы, но нужного не оказалось, то убираем условие нафиг!
            if self._is_param_empty(value):
                return

            # Хитрая замена IN (ARRAY[]) на ANY(ARRAY[])
            if isinstance(value, (list, tuple)):
                right = func_generator.any(right)

        exp = func(left, right)
        return exp
    
    def get_raw_sql(self):
        """ Возвращает текст SQL запроса для Entity """
        sql = str(self.create_query())
        if sqlparse:
            sql = sqlparse.format(sql, reindent=True, keyword_case='upper')
        return sql

    def get_data(self, params=None):
        """ Возвращает данные, полученные в результатет выполнения запроса """
        params = params or {}

        #TODO: Потокоопасный метод! Надо использовать пул, живущий только во время формирования.
        BaseAlchemyObject.clear_instances()

        #params['EntityTree.created'] = datetime.date(2000,1,1)
        query = self.create_query(params=params, first_head=True)

        WRAPPER.engine.echo = True
        cursor = query.execute(params)
        data = cursor.fetchall()
        
        if self.result_type == BaseEntity.USE_DICT_RESULT:
            # Если указан флаг, использовать объект            
            if len(data) == 0:
                raise BaseEntity.NotFoundResultException(u'Нет данных для создания объекта')
            elif len(data) > 1:
                raise BaseEntity.MultipleResultException(u'Возвращено больше одной записи для создания объекта')                
            else:
                # Возьмем первую запись
                data = dict(zip([field.get_full_field_name() for \
                                    field in self.get_select_fields()] ,data[0]))                
        
        return data

    def get_query_parameters(self):
        """ Возвращает список экземпляров Param в запросе и всех вложенных в него подзапросах """
        all_params = []

        # Получаем параметры из вложенных BaseEntity
        for ent in self.entities:
            if isinstance(ent, Entity):
                ent_class = EntityCache.get_entity(ent.name)
                ent_ins = ent_class()
                query_params = ent_ins.get_query_parameters()
                all_params.extend(query_params)

        # Получаем параметры из WHERE
        if isinstance(self.where, Where):
            where_params = self.where.get_parameters(self)
            all_params.extend(where_params)

        # Получаем из LIMIT и OFFSET
        if isinstance(self.limit, Param):
            self.limit.bind_to_entity(self)
            all_params.append(self.limit)

        if isinstance(self.offset, Param):
            self.offset.bind_to_entity(self)
            all_params.append(self.offset)

        return all_params

#===============================================================================
# Базовый класс, для описания статических данных
class BaseData(object):
    '''
    Для описания произвольных данных
    '''    
    # Человеческое название данных для выбора
    verbose_name = None
    
    @classmethod
    def get_data(cls):
        '''
        Данные должны быть возвращены в виде:
        [(id1, name1),(id2, name2),(id3, name3)]
        То есть список кортежей, состоящих из двух элементов
        '''
        raise NotImplemented('Method get_data() must be implemented in subclass')

#TODO: Прогнать через code coverage и найти мертвые места