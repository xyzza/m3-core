#coding:utf-8
'''
Created on 25.05.2011

@author: prefer
'''

import threading
import inspect

from django.conf import settings
from django.utils.importlib import import_module


class EntityCache(object):
    '''
    Загружает и хранит список определенных сущностей в проекте
    '''
    
    _loaded = False
    _write_lock = threading.RLock()
    
    # Список сущностей
    _entities = []
    
    # Список классов для произвольных данных 
    _data_classes = []
    
    @classmethod
    def populate(cls):
        '''
        Собирает в отдельном потоке все сущности и наборы данных из установленных приложений с 
        названием schema
        '''
        if not cls._loaded:
            with cls._write_lock:
                for app_name in settings.INSTALLED_APPS:
                    try:
                        module = import_module('.schema', app_name)
                    except ImportError, err:
                        if 'No module named' not in err.args[0]:
                            raise
                        continue
                                        
                    entities_module = []
                    data_class = []
                    for _, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and hasattr(obj, '__module__') and obj.__module__ == module.__name__:
                            # Чтобы не было кроссимпорта!
                            if 'BaseEntity' in [x.__name__ for x in obj.__bases__]:
                                entities_module.append(obj)
                                
                            # Чтобы не было кроссимпорта!
                            if 'BaseData' in [x.__name__ for x in obj.__bases__]:
                                data_class.append(obj)
                    
                    cls._entities.extend(entities_module)
                    cls._data_classes.extend(data_class)

                cls._loaded = True
                
                
    @classmethod        
    def get_entities(cls):
        '''
        Возвращает список сущностей
        '''
        cls.populate()        
        return cls._entities
    
    @classmethod
    def get_entity(cls, name):
        '''
        Возвращает сущность по имени класса
        '''
        cls.populate()
        for entitiy in cls._entities:
            if entitiy.__name__ == name:
                return entitiy
        
    @classmethod        
    def get_data_classes(cls):
        '''
        Возвращает список классов для произвольных данных
        '''
        cls.populate()        
        return cls._data_classes
    
    @classmethod
    def get_data_class(cls, name):
        '''
        Возвращает класс произвольных данных
        '''
        cls.populate()
        for cl in cls._data_classes:
            if cl.__name__ == name:
                return cl