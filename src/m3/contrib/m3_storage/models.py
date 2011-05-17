#coding:utf-8
'''
Created on 01.05.2011

@author: akvarats
'''

from django.db import models 

from m3.db import BaseEnumerate

class FieldTypeEnum(BaseEnumerate):
    '''
    Перечисление типов полей, которые могут использоваться
    '''
    CHAR = 1
    INTEGER = 2
    DECIMAL = 3
    TEXT = 4
    DATE = 5
    DATETIME = 6
    INNER_FK = 7
    MODEL_FK = 8
    
    values = {CHAR: u'Строка',
              INTEGER: u'Целое',
              DECIMAL: u'Числовое',
              TEXT: u'Текст',
              DATE: u'Дата',
              DATETIME: u'Дата/время',
              INNER_FK: u'Ссылка',
              MODEL_FK: u'Внешняя ссылка',}
    

class RelationTypeEnum(BaseEnumerate):
    '''
    Перечисление типов связей между моделями в базе данных
    '''
    # Ассоцияция - это обычный тип связи между двумя таблицами, когда 
    # записи одной таблицы просто ссылаются на записи другой таблицы.
    ASSOCIATION = 1
    # Табличная часть - связь между мастер-таблицей и дитейл-таблицей.
    # Такая связь моделирует отношение "Документ - Детализация (табличная часть)"
    MASTER_DETAIL = 2
    
class StorageConfigurationModel(models.Model):
    '''
    Модель конфигурации хранлища данных
    '''
    # человеческое наименование конфигурации хранилища
    name = models.CharField(max_length=300, blank=True)
    # версия объектов конфигурации 
    version = models.PositiveIntegerField()
    # признак того, что конфигурация является текущей активной в системе
    active = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'm3storage_configs'
    

class StorageTableModel(models.Model):
    '''
    Модель хранения описания таблица
    '''
    # ссылка на конфигурацию, в рамках которой доступна данная таблица
    configuration = models.ForeignKey(StorageConfigurationModel)
    # наименование таблицы в базе данных
    name = models.CharField(max_length=30, blank=False, db_index=True)
    # описательное название таблицы
    verbose_name = models.CharField(max_length=200, blank=True)
    # комментарий пользователя к таблицу
    comment = models.TextField()
    
    
    class Meta:
        db_table = 'm3storage_tables'
            
class TableFieldModel(models.Model):
    '''
    Модель хранения описания поля в базе данных
    '''
    # ссылка на модель, описывающую таблицу
    table = models.ForeignKey(StorageTableModel)
    # наименование поля
    name = models.CharField(max_length=50, blank=False, db_index=True)
    # указание на тип поля
    type = models.SmallIntegerField(choices = FieldTypeEnum.get_choices())
    # признак индексированного поля
    indexed = models.BooleanField(default=False)
    # признак того, что в поле допустимы пустые значения на уровне СУБД
    allow_blank = models.BooleanField(default=True)
    # размер поля (распространяется на CharField и DecimalField)
    size = models.IntegerField(default=0)
    # "второй" размер поля (распространяется на DecimalField)
    size_secondary = models.IntegerField(default=0)
    # Указание на ссылку
    
    # дополнительные атрибуты, описывающие тип поля
    # формат хранения поля: json
    # например, {default: 0, ...}
    attributes = models.CharField(max_length=300, blank=True)
    
    class Meta:
        db_table = 'm3storage_fields'
        
        
class TableRelationModel(models.Model):
    '''
    Модель, описывающая отношение между двумя таблицами
    '''
    # ссылка на конфигурацию, в рамках которой доступна данная таблица
    configuration = models.ForeignKey(StorageConfigurationModel)
    # левая (начальная) таблица в связи
    left_table = models.CharField(max_length=100, blank=True)
    # правая (конечная) таблица в связи
    right_table = models.CharField(max_length=100, blank=True)
    # тип связи
    type = models.SmallIntegerField(choices = RelationTypeEnum.get_choices())
    # комбинация полей, которые формируют ключ в левой таблице
    # поля перечисляются через запятую
    left_key = models.CharField(max_length=300, blank=True)
    # комбинация полей, которые формируют ключ в правой таблице
    # поля перечисляются через запятую
    right_key = models.CharField(max_length=300, blank=True)
    
    class Meta:
        db_table = 'm3storage_relations'