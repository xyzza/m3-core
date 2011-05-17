#coding:utf-8
'''
Created on 01.05.2011

@author: akvarats
'''

from m3.db.ddl import BaseMigrator

class StorageMigrator(BaseMigrator):
    '''
    Мигратор, который выполняет функции изменения структуры базы данных хранилища 
    на основе внутренней модели версионности описаний таблиц базы данных
    '''
    def _get_active_version(self, table_name):
        '''
        Достаем активное состояние модели из конфигурации модели
        '''
        
    
    def _register_active_version(self, table_name, active_version):
        pass
    
    
