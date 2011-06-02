#coding: utf-8
'''
Created on 26.05.2011

@author: prefer
'''
from m3.helpers.datastructures import TypedList
from m3.db.alchemy_wrapper import SQLAlchemyWrapper

from django.conf import settings
from django.db.models.loading import cache
from sqlalchemy.sql.expression import join, select


WRAPPER = SQLAlchemyWrapper(settings.DATABASES)

class Relation(object):
    '''
    Связь между сущностями
    '''
    def __init__(self, entity_first, key_first, entity_second, key_second):
        '''
        @param table_first: Первая сущность
        @param key_first: Первый ключ для связи
        @param entity_second: Вторая сущность
        @param key_second: Второй ключ для связи 
        '''
        self.table_first = entity_first
        self.key_first = key_first
        
        self.table_second = entity_second
        self.key_second = key_second
        

class Table(object):
    '''
    Для обозначения таблиц в схемах
    '''        
    def __init__(self, name, alias=None, verbose_name=None):
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name


class Model(object):
    '''
    Для обозначения моделей в схемах
    '''
    
    def __init__(self, name, alias=None, verbose_name=None):
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name


class Entity(object):
    '''
    Для обозначения сущности в схемах
    '''
    def __init__(self, name, alias=None, verbose_name=None):
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name


class Field(object):
    '''
    Для обозначения поля
    '''
    
    # Все поля
    ALL_FIELDS = '*'
    
    def __init__(self, name, alias=None, verbose_name=None):
        self.name = name
        self.alias = alias
        self.verbose_name = verbose_name

        
class BaseEntity(object):
    '''
    Базовый класс для сущностей/схемы/прокси/view - кому как удобно
    В дальнейшем будем употреблять "сущность"
    ps: view в контексте бд
    '''
    
    # Имя сущности
    name = ''
    
    # Список объектов (модели, сущности, имена таблиц), используемых во текущей
    # сущности.    
    entities = []
    
    # Типизированный список связей, над вышеупомянутами объектами
    relations = TypedList(type=Relation)
    
    # Список полей, по которым нужно проводить группировку
    group_by = []
    
    # Объект условий
    where = None
    
    # Словарь с алиасами для полей в select'e запроса
    select = {}
    
    # Выводить повторяющиеся записи?
    distinct = None
    
    # Количество показываемых записей
    limit = None

    def __init__(self):
        self.metadata = WRAPPER.metadata
        self.session = WRAPPER.session
        self.app2map = self._create_app2models_map()
        
    def _create_app2models_map(self):
        """ Возвращает словарь из полных имен моделей и физических имен таблиц """
        result = {}
        for model in cache.get_models():
            full_name = model._meta.app_label + '.' + model._meta.object_name
            table_name = model._meta.db_table
            table = self.metadata.tables[table_name]
            
            result[full_name] = table
        
        return result
    
    # Не удалять! Используется ниже!
#    def get_tables(self, entity):
#        """ 
#        Возвращает словарь из имен моделей и доступных таблиц
#        верхнего уровня для запроса по сущности.
#        """
#        assert isinstance(entity, BaseEntity)
#        result = {}
#        for ent in entity.entities:
#            if isinstance(ent, Model):
#                table = self.app2map.get(ent.name)
#                if table is None:
#                    raise Exception(u'Не удалось найти модель по имени %s' % ent.name)
#                
#                result[ent.name] = table
#                
#        return result

    def _get_field_real_name(self, model_full_name, column_name):
        """ 
        Возвращает реальное имя поля в БД 
        по имени колонки column_name в модели model_name 
        """
        app_name, model_name = model_full_name.split('.')
        model = cache.get_model(app_name, model_name)
        if not model:
            raise Exception(u'Не удалось найти модель по имени %s ' % model_full_name)
        
        field = model._meta.get_field(column_name)
        return field.get_attname()
    
    def _get_table_by_model(self, model_name):
        """ Возвращает таблицу алхимии по имени модели Django """
        table = self.app2map.get(model_name)
        if table is None:
            raise Exception(u'Не найдена таблица для модели с именем %s' % model_name)
        return table
    
    def _get_column(self, model_name, field_name):
        """ Возвращает колонку алхимии по имени модели и имени поля """
        table = self._get_table_by_model(model_name)
        real_name = self._get_field_real_name(model_name, field_name)
        column = table.columns.get(real_name)
        if column is None:
            raise Exception(u'В модели %s не найдена колонка %s' % (model_name, field_name))
        return column
    
    def create_query(self):
        """ Возвращает готовый запрос алхимии по параметрам Entity """       
#        # А нафига мне это?
#        tables = self.get_tables(entity)
#        if not len(tables):
#            raise Exception(u'Нет данных для FROM')
        
        # Подготовка колонок для выбора SELECT
        if not len(self.select):
            raise Exception(u'Нет данных для SELECT')
        select_columns = []
        for model_name, field in self.select.items():
            table = self._get_table_by_model(model_name)
            
            # Отдельное поле
            if isinstance(field, Field):
                field_real_name = self._get_field_real_name(model_name, field.name)
                column = table.columns.get(field_real_name)
                if column is None:
                    raise Exception(u'В модели %s не найдено поле %s' % (model_name, field_real_name))
                
                if field.alias:
                    column = column.label(field.alias)
                    
                select_columns.append(column)

            # Все поля
            elif field == Field.ALL_FIELDS:
                select_columns.append(table)
        
        # Подготовка объединений JOIN. Важна последовательность!
        join_sequence = None
        last_column = None
        for rel in self.relations:
            assert isinstance(rel, Relation)           

            left_column = self._get_column(rel.table_first, rel.key_first)
            right_column = self._get_column(rel.table_second, rel.key_second)
            
            if join_sequence is None:
                last_column = right_column
                
                onclause = (left_column == right_column) # _BinaryExpression
                join_sequence = join(left_column.table, right_column.table, onclause)

            else:
                assert left_column.table == last_column.table
                
                onclause = (last_column == right_column) # _BinaryExpression
                join_sequence = join_sequence.join(right_column.table, onclause)
        
        # Условия WHERE
        whereclause = None
        
        query = select(columns=select_columns, whereclause=whereclause, from_obj=[join_sequence])
        return query

    def get_select_fields(self):
        """ Возвращает список всех полей entity.Field из SELECT """
        fields = []
        for model_name, field in self.select.items():
            if field == Field.ALL_FIELDS:
                app, model = model_name.split('.')
                model = cache.get_model(app, model)
                assert model is not None
                
                for lf in model._meta.local_fields:
                    new_field = Field(name=lf.attname, verbose_name=lf.verbose_name)
                    fields.append(new_field)
                    
            else:
                if not field.verbose_name:
                    field.verbose_name = u'бла-бла-бла'
                fields.append(field)
        
        return fields
    
    def get_raw_sql(self):
        """ Возвращает текст SQL запроса для Entity """
        return str(self.create_query())
    
    def get_data(self):
        """ Возвращает данные, полученные в результатет выполения запроса """
        query = self.create_query()
        cursor = query.execute()
        data = cursor.fetchall()
        return data    

#TODO: Сортировать последовательность join'ов
#TODO: Что-то делать с атрибутом entities 
#TODO: Допилить получение verbose_name
#TODO: Поддержка вложенных Entity
