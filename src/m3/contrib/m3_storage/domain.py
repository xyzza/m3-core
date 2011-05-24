#coding:utf-8
'''
Created on 03.05.2011

@author: akvarats
'''

from m3.db.api import get_object_by_id
from m3.db import ddl

from models import (StorageConfigurationModel,
                    StorageTableModel,
                    TableRelationModel,
                    TableFieldModel,
                    RelationTypeEnum,
                    FieldTypeEnum,)

from exceptions import StorageMisconfigured                    

class StorageConfiguration(object):
    '''
    Объект, представляющий конфигурацию хранилища
    '''
    
    def __init__(self):
        self.clear()
    
    def clear(self):
        '''
        Очищает объект от предыдущих считанных данных
        '''
        # словарь таблиц хранилища. ключ - идентификатор таблицы
        self.tables = []
        # словарь отношений между таблицами внутри 
        self.relations = []
        
        self.tables_map = {}
    
    def read(self, configuration_model):
        '''
        Читает конфигурацию хранилища на основе модели хранения конфигурации
        StorageConfigurationModel
        '''
        self.clear()
        
        self.configuration_model = get_object_by_id(StorageConfigurationModel, configuration_model)
        if not self.configuration_model:
            return 
        
        tables = StorageTableModel.objects.filter(configuration=configuration_model)
        relations = TableRelationModel.objects.filter(configuration=configuration_model)
        
        for table_model in tables:
            table = StorageTable()
            table.read(table_model)
            self.tables.append(table)
            self.tables_map[table_model.name] = table
            
        for relation_model in relations:
            relation = StorageTableRelation()
            relation.read(relation_model, self.tables_map)
            self.relations.append(relation)

class StorageTable(object):
    '''
    Объект, представляющий хранимую таблицу в базе данных 
    ''' 
    
    def __init__(self):
        self.clear()
        
    def clear(self):
        self.name = ''
        self.fields = []
        self.table_model = None   
    
    def read(self, table_model):
        '''
        Читает конфигурацию таблицы из базы данных на основе модели
        StorageTableModel
        '''
        self.clear()
        self.table_model = get_object_by_id(StorageTableModel, table_model)
        
        if not self.table_model:
            return
        
        self.name = self.table_model.name
        self.fields.extend(TableFieldModel.objects.filter(table = self.table_model))
        
    def ddl_wrapper(self):
        '''
        Возвращает обертку над таблицей для подсистемы m3.db.ddl
        '''
        ddl_table = ddl.DBTable()
        ddl_table.name = self.name
        for field in self.fields:
            ddl_table.fields.append(self._ddl_field_wrapper(field))
            
    def _ddl_field_wrapper(self, field):
        '''
        Возвращает обертку над полем таблицы для подсистемы m3.db.ddl
        '''
        field_type_map = {FieldTypeEnum.PK: ddl.IDField,
                          FieldTypeEnum.CHAR: ddl.CharField,
                          FieldTypeEnum.INTEGER: ddl.IntegerField,
                          FieldTypeEnum.DECIMAL: ddl.DecimalField,
                          FieldTypeEnum.TEXT: ddl.TextField,
                          FieldTypeEnum.DATE: ddl.DateField,
                          FieldTypeEnum.DATETIME: ddl.DateTimeField,
                          FieldTypeEnum.INNER_FK: ddl.IntegerField,
                          FieldTypeEnum.MODEL_FK: ddl.IntegerField,}
        
        result = field_type_map[field.type]
        result.name = field.name
        result.allow_blank = field.allow_blank
        result.indexed = field.indexed
        
        # TODO: тут пока нет поддержки дополнительных атрибутов поля,
        # таких как, например, значение по умолчанию, либо размерность
        # поля.
        
        return result
            

#===============================================================================
# Описание отношений между таблицами в базе данных
#===============================================================================

class StorageTableRelation(object):
    '''
    Класс представляющий 
    '''
    def __init__(self):
        self.clear()
        
    def clear(self):
        '''
        Очищает существующий/подготавливает новый объект связи между двумя таблицами
        '''
        self.relation_model = None
        self.left_table = None
        self.right_table = None
        self.type = RelationTypeEnum.ASSOCIATION
        self.left_fields = [] # названия полей, которые вступают в связь в левой таблице
        self.right_fields = [] # названия полей, которые вступают в связь в правой таблице
    
    def read(self, relation_model, tables_map):
        '''
        Читает объект связи между двумя таблицами
        '''
        
        if not tables_map:
            return
        
        self.clear()
        self.relation_model = get_object_by_id(TableRelationModel, relation_model)
        if not self.relation_model:
            pass
        
        self.left_table = tables_map.get(self.relation_model.left_table, None) 
        self.right_table = tables_map.get(self.relation_model.right_table, None)
        
        if not self.left_table:
            raise StorageMisconfigured(u'В конфигурации существует отношение, которое в левой части которого указана несуществющая таблица "%s"' % self.relation_model.left_table )
        
        if not self.right_table:
            raise StorageMisconfigured(u'В конфигурации существует отношение, которое в правой части которого указана несуществющая таблица "%s"' % self.relation_model.right_table )

        
        self.left_fields = self.relation_model.left_key.split(',')
        self.right_fields = self.relation_model.right_key.split(',')
        
        self.type = self.relation_model.type