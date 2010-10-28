#coding:utf-8
'''
Различные модели кеширования информации в рантайме приложения

@author: akvarats
'''

import threading

class CacheStat(object):
    '''
    Класс, хранящий статистику обращения к кешу
    '''
    def __init__(self):
        self.in_cache = 0  # число попаданий в закешированные данные
        self.out_cache = 0 # число непопаданий в закешированные данные
        self.drops = 0 # количество сбросов кеша с момента создания
        self.full_drops = 0 # количество полных сбросов кеша с момента создания

class RuntimeCacheMetaclass(type):
    '''
    Метакласс, который позволяет делать синглтоны, объединенные в иерархию, но при этом
    каждый уровень иерархии имеет свой shared_state.
    
    Метакласс замещает __init__ управляемого класса, в результате чего этот метод 
    недоступен прикладным разработчикам. Для реализации логики инициализации класса 
    можно реализовать метод custom_init(*args, **kwargs).  
    '''
    def __new__(cls, name, bases, attrs):
        
        def default_init(self, *args, **kwargs):    
            self.__dict__ = self._shared_state
            # добавляем возможность вызова кастомного инита (обычный уже использован и 
            # не может быть реализован в дочерних к RuntimeCache классах
            if hasattr(self, 'custom_init') and callable(self.custom_init):
                self.custom_init(*args, **kwargs)
            
            # в случае, если внутри класса кеша задан обработчик, то мы пытаемся его зарегистировать
            if hasattr(self, 'handler') and callable(self.handler) and not self.handler_registered(self.handler):
                self.register_handler(self.handler)
            
        klass = super(RuntimeCacheMetaclass, cls).__new__(cls, name, bases, attrs)
        
        klass._shared_state = dict(
            loaded = {}, # словарь разрезов, по которым данные уже прогружены в систему
            handlers = [], # список хендлеров, которые используются для
            handler_run_rules = {},
            data = {}, # собственно те данные, которые лежат в кеше
            write_lock = threading.RLock(),
            stat = CacheStat(),
        )
        klass.__init__ = default_init
        
        print klass.__dict__.has_key('handler')
        
        return klass
    
class RuntimeCache(object):
    '''
    Класс, используемый для кеширования данных в рантайме приложения.
    
    Использование данного класса:
    '''
    __metaclass__ = RuntimeCacheMetaclass 
    
    def register_handler(self, handler):
        '''
        Регистрирует обработчик заполнения кешированных данных. 
        ''' 
        # TODO: в качестве возможности будущего расширения функционала данного класса
        # можно предусмотреть возможность указания хендлеров сборки кеша
        # для отдельных значений измерений. Для хранения маппинга хендлеров
        # и измерений предусмотрен словарь handler_run_rules
        
        assert callable(handler), u'Обработчик заполнения кеша должен быть callable'
        
        # TODO: не совсем понятно, нужно ли ставить lock в данном случае
        try:
            self.write_lock.acquire()
            if handler not in self.handlers:
                self.handlers.append(handler)
        finally:
            self.write_lock.release()
    
    def handler_registered(self, handler):
        '''
        Проверяет, если ли в списке обработчиков кеша указанный хендлер
        '''
        return handler in self.handlers
    
    def _normalize_dimensions(self, dimensions):
        '''
        Выполняет нормализацию переданных измерений
        '''
        result = ()
        if dimensions:
            result = dimensions if isinstance(dimensions, tuple) else (dimensions,)
        return result
                 
    
    def _populate(self, dimensions):
        '''
        Метод собирает информацию по кешируемым объектам.
        
        Возвращает True, если populate реально состоялся
        '''
        dims = self._normalize_dimensions(dimensions)
        
        if self.loaded.has_key(dims):
            return False
        
        try:
            self.write_lock.acquire()
            if self.loaded.has_key(dims):
                return False
            for handler in self.handlers:
                prepared_data = handler(self, dims)
                if isinstance(prepared_data, dict):
                    for key,value in prepared_data.iteritems():
                        self.set(key, value)
            self.loaded[dims] = True
        finally:
            self.write_lock.release()
            
        return True
    
    def set(self, dimensions, value):
        '''
        Устанавливает значение в кеше
        '''
        self.data[self._normalize_dimensions(dimensions)] = value
        
    def get(self, dimentions, default=None):
        '''
        Возвращает значение из кеша
        '''
        dims = self._normalize_dimensions(dimentions)
        if self._populate(dims):
            self.stat.out_cache += 1
        else:
            self.stat.in_cache += 1
        return self.data.get(dims, default)
    
    def get_size(self):
        '''
        Возвращает количество объектов, помещенных в кеш
        '''
        return len(self.data)
    
    def drop(self, dimensions):
        '''
        Метод сброса кеша по измерению
        '''
        dims = self._normalize_dimensions(dimensions)
        
        try:
            self.write_lock.acquire()
            self.loaded.pop(dims, None)
            self.data.pop(dims, None)
            self.stat.full_drops = 1
        finally:
            self.write_lock.release()
        
    def drop_all(self):
        try:
            self.write_lock.acquire()
            self.loaded = {}
            self.data = {}
            self.stat.full_drops += 1
        finally:
            self.write_lock.release()
            
    
    def clear_stat(self):
        self.stat = CacheStat()