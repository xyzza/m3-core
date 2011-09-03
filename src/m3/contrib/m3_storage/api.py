#coding:utf-8
'''
Внешнее API подсистемы m3_storage 

Created on 01.05.2011

@author: akvarats
'''

from django.db import transaction

from m3.contrib.m3_storage.models import TableFieldModel, StorageTableModel, FieldTypeEnum
from m3.db.alchemy_wrapper import ModelCollection
from m3.helpers import logger

from models import StorageConfigurationModel
from domain import StorageConfiguration
from migrator import StorageMigrator

#===============================================================================
# Работа с конфигурациями система
#===============================================================================
from sqlalchemy import types
from sqlalchemy.schema import Table, Column, MetaData

def get_active_configuration():
    '''
    Метод получения текущей активной конфигурации
    '''
    try:
        active_config = StorageConfigurationModel.objects.get(active=True)
    except StorageConfigurationModel.DoesNotExist:
        active_config = None
        
    return active_config

@transaction.commit_on_success
def activate_configuration(configuration):
    '''
    Выполняет активацию конфигурации со всеми вытекающими для 
    структуры хранилища последствиями
    '''
    
    if not configuration:
        return
    
    left_config = StorageConfiguration()
    right_config = StorageConfiguration()
    
    # 1. получаем текущую активную конфигурацию
    left_config_model = get_active_configuration() # отсюда мигрируем
    right_config_model = configuration # сюда мигрируем
    
    if not left_config_model:
        # активной конфигурации на данный момент не задано,
        # поэтому делаем вид, что переходим с пустой конфигурации
        left_config_model = StorageConfigurationModel()
        
    left_config.read(left_config_model)
    right_config.read(right_config_model)
        
    # 2. сбрасываем активность всех конфигураций в False, а затем выставляем
    # её у требуемой
    StorageConfigurationModel.objects.update(active=False)
    
    configuration.active = True
    configuration.save()
    
    # 3. запускаем миграцию с текущей активной конфигурации
    #    на требуемую.
    
    # TODO: написать метод сравнения двух конфигураций и запуска миграций 
    # в таблицах базы данных 
    migrator = StorageMigrator(manual_transaction=True)
    migrator.start_transaction()
    try:
        # мигрируем таблицы с конфигурации currently_active_configuration
        # в configuration
        
        for left_table in left_config.tables:
            right_table = right_config.tables_map.get(left_table.name)
            if right_table:
                migrator.migrate(right_table.ddl_wrapper(), left_table.ddl_wrapper())
                            
    except:
        logger.exception(u'Не удалось активировать конфигурацию %s (%s)' % (configuration.version, configuration.name))
        migrator.rollback_transaction()
    else:
        migrator.commit_transaction()


class AlchemyM3StorageFactory(object):
    """ Преобразует схему данных объявленную с помощью m3_storage в таблицы алхимии """

    def __init__(self, wrapper):
        self.wrapper = wrapper

    def _convert_type(self, field):
        assert isinstance(field, TableFieldModel)
        is_pk = False

        if field.type == FieldTypeEnum.PK:
            value = types.BigInteger()
            is_pk = True

        elif field.type == FieldTypeEnum.CHAR:
            value = types.Unicode(field.size)

        elif field.type == FieldTypeEnum.INTEGER:
            value = types.Integer()

        elif field.type == FieldTypeEnum.DECIMAL:
            value = types.Numeric(precision=field.size, scale=field.size_secondary)

        elif field.type == FieldTypeEnum.TEXT:
            value = types.UnicodeText()

        elif field.type == FieldTypeEnum.DATE:
            value = types.Date()

        elif field.type == FieldTypeEnum.DATETIME:
            value = types.DateTime()

        elif field.type == FieldTypeEnum.INNER_FK:
            raise NotImplemented()

        elif field.type == FieldTypeEnum.MODEL_FK:
            raise NotImplemented()

        else:
            raise TypeError('Unknown type %s' % type)

        return value, is_pk

    def make_models(self, cfg):
        """ Преобразует конфигурацию m3_storage в метаданные алхимии """
        assert isinstance(cfg, StorageConfigurationModel)

        metadata = MetaData(self.wrapper.engine)

        # Бежим по моделям в хранилище
        q_tables = StorageTableModel.objects.filter(configuration=cfg)
        for storage_table in q_tables:

            # Обработка полей
            fields = []
            q_fields = TableFieldModel.objects.filter(table=storage_table)
            for storage_field in q_fields:
                type_, is_pk = self._convert_type(storage_field)
                column = Column(
                    name = storage_field.name,
                    type_ = type_,
                    nullable = storage_field.allow_blank,
                    index = storage_field.indexed,
                    autoincrement = is_pk,
                    primary_key = is_pk
                )
                fields.append(column)

            # Создаем модель алхимии
            if not len(fields):
                raise Exception('No fields found for table %s' % storage_table.name)
            Table(storage_table.name, metadata, *fields)

        return metadata

    def make_maps(self, meta):
        db = ModelCollection()
        for name, table in meta.tables.items():
            map_class = self.wrapper.create_map_class(name, table)
            if map_class:
                db[name] = map_class

        return db