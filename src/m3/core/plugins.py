#coding: utf-8
'''
Created on 17.09.2010

@author: akvarats
'''

import threading

from django.conf import settings

from django.utils.importlib import import_module

class ExtensionPoint:
    '''
    Класс, описатель точек расширения
    '''
    def __init__(self, name = '', default_listener = None):
        
        # название точки расширения
        # названия точек расширения необходимо выполять в форме 
        # mis.core.schedules.get-busy-perions
        self.name = name
        # человеческое название точки расширения
        self.verbose_name = u'Точка расширения'
        # листенер, который добавляется по умолчанию
        self.default_listener = default_listener

class ExtensionHandler:
    '''
    Класс - обертка над обработчиком точки расширения
    '''
    #===========================================================================
    # Константы, которые определяет порядок вызова листенера
    # точки расширения
    #===========================================================================
    INSTEAD_OF_PARENT = 0
    BEFORE_PARENT = 1
    AFTER_PARENT = 2
    
    def __init__(self, handler = None, call_type = INSTEAD_OF_PARENT):
        self.handler = handler
        self.call_type = call_type
        
ExtensionListener = ExtensionHandler # совместимость

class ExtensionManager:
    '''
    Класс, который управляет точками расширения приложений 
    '''
    __shared_state = dict(
        loaded = False,
        # словарь точек расширения. ключом являются наименование точки ExtensionPoint.name
        extensions = {},
        # словарь листенер, которые выполняются для точек расширения
        # ключом является наименование точки расширения, значениями - список
        listeners = {},
        # стек выполнения листенеров
        stack = {},
        _write_lock = threading.RLock(),
    )
    
    def __init__(self):
        self.__dict__ = self.__shared_state  
    
    def _populate(self):
        '''
        Метод собирает точки расширения из
        app_meta приложений
        '''
        if self.loaded:
            return False
        self._write_lock.acquire()
        try:
            if self.loaded:
                return False
            for app_name in settings.INSTALLED_APPS:
                try:
                    module = import_module('.app_meta', app_name)
                except ImportError, err:
                    if err.args[0].find('No module named') == -1:
                        raise
                    continue
                proc = getattr(module, 'register_extensions', None)
                if callable(proc):
                    proc()
            self._loaded = True
        finally:
            self._write_lock.release()
    
    def register_point(self, extension_point):
        '''
        Добавляет точку расширения
        '''
        if  not extension_point or \
            not isinstance(extension_point, ExtensionPoint) or \
            not extension_point.name or \
            not extension_point.name.strip() or \
            not isinstance(extension_point.default_listener, ExtensionListener) or \
            self.extensions.has_key(extension_point.name):
                # передали неправильное определение точки расширения
                # ничего не делаем
                return
        
        point_key = extension_point.name.strip()
        self.extensions[point_key] = extension_point
        self.listeners[point_key] = [extension_point.default_listener,]
    
    append_point = register_point # для совместимости 
    
    def append_handler(self, extension_name, listener):
        '''
        Добавляет листенер точки расширения с именем extension_name
        '''
        if  not self.extensions.has_key(extension_name) or \
            not listener or \
            not isinstance(listener, ExtensionListener) or \
            not listener.handler:
                # передали неправильное определение листенера
                # ничего не делаем
                return
        self.listeners[extension_name].append(listener)
    
    append_listener = append_handler # для совместимости
    
    def execute(self, extension_name, *args, **kwargs):
        '''
        Выполняет связанное с точкой расширения текущее действие
        '''
        result = None
        if not self.loaded:
            self._populate()
        
        if not self.extensions.has_key(extension_name) or not self.listeners.has_key(extension_name):
            return None
        
        if  not self.stack.has_key(extension_name) or not self.stack[extension_name]:
            # необходимо выполнить подготовку стека вызовов
            listener_stack = []
            if len(self.listeners[extension_name]) == 1 and not self.listeners[extension_name]:
                # обработка случая, когда в качестве дефолтного листенера задан
                # пустой обработчик и больше обработчиков нет
                listener_stack = [None,]
            else:
                for listener in self.listeners[extension_name]:
                    if not listener or not listener.handler:
                        continue
                    if listener.call_type == ExtensionListener.INSTEAD_OF_PARENT:
                        listener_stack = [listener,]
                    elif listener.call_type == ExtensionListener.BEFORE_PARENT:
                        listener_stack.insert(0, listener)
                    else:
                        listener_stack.append(listener)
            
            self.stack[extension_name] = listener_stack
        
        # собственно, выполняем точки расширения
        for listener in self.stack[extension_name]:
            kwargs['ext_result'] = result
            if listener and callable(listener.handler):
                result = listener.handler(*args, **kwargs)
            
        return result