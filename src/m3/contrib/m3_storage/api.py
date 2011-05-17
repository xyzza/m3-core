#coding:utf-8
'''
Внешнее API подсистемы m3_storage 

Created on 01.05.2011

@author: akvarats
'''

from django.db import transaction


from m3.db.ddl import NullTable
from m3.helpers import logger

from models import StorageConfigurationModel
from domain import StorageConfiguration
from migrator import StorageMigrator

#===============================================================================
# Работа с конфигурациями система
#===============================================================================

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