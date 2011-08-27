#coding:utf-8
'''
Реализация различных реквестов, которые используются для передачи сообщений.

Created on 15.08.2011

@author: akvarats
'''

import poster.encode

from m3.core.json import M3JSONEncoder
from m3.db import BaseEnumerate
from m3.misc.ibus import InteractionMode

import helpers

class Request(object):
    '''
    Базовый класс для всех реквестов к транспортному серверу/интеграционной шине.
    '''
    
    def __init__(self, category, params=[], mode=InteractionMode.ASYNC):
        '''
        @param category: категория сообщений. предназначена для правильного использования в интеграционной шине;
        @param params: параметры, которые сопровождают запрос на получение данных. Это список значений объектов типа RequestParam;
        @param mode: режим взаимодействия с получателем сообщения (синхронный, асинхронный);
        '''
        self.category = category
        self.params = params
        self.mode = mode

    
    def encode(self):
        '''
        Метод, который отвечает за encoding параметров
        '''
        raw_params = {}
        
        # добавляем служебные параметры в запрос
        raw_params['ibus-target'] = self.category
        raw_params['ibus-sender'] = helpers.get_sender()
        raw_params['ibus-interaction-mode'] = InteractionMode.names[self.mode]
        
        for param in self.params:
            if isinstance(param, tuple) and len(param) > 1:
                raw_params[param[0]] = param[1]
            elif isinstance(param, RequestParam):
                k,v = param.raw_param()
                raw_params[k] = v
        
        datagen, headers = poster.encode.multipart_encode(raw_params)
        
        # финализируем параметры
        for param in self.params:
            if isinstance(param, RequestParam):
                param.finalize()
                
        return (datagen, headers)
    
class SimpleObjectRequest(Request):
    '''
    Запрос на отправку списка объектов транспорту.
    '''
    
    def __init__(self, category, objects, obj_type='', mode=InteractionMode.ASYNC):
        '''
        В дополнение к параметрам верхнего уровня указывается:
        @param objects: список объектов, подлежащий отправке
        @param obj_type: наименование типа объекта, которое будет передано в теле запроса.
        
        В случае, если тип объекта не будет указан, то система попытается получить
        наименование самостоятельно, исходя из предъявленных к передаче объектов.
        '''
        super(SimpleObjectRequest, self).__init__(category=category, params=[], mode=mode)
        self.objects = objects
        self.obj_type = obj_type
        
    def encode(self):
        '''
        Переопределяем метод для того, чтобы добавить в параметры
        сериализованное представление объекта
        '''
        if self.objects:
            self.params.append(StringParam('objects', self._encode_objects()))
            self.params.append(StringParam('object_type', self.obj_type or self._encode_object_type()))
        return super(SimpleObjectRequest, self).encode()
        
    def _encode_objects(self):
        '''
        Метод, который выполняет преобразование объектов в json формат.
        '''
        return M3JSONEncoder().encode(self.objects)
    
    def _encode_object_type(self):
        '''
        Метод, который возвращает строковое представление типов объектов, которые 
        передаются в рамках реквеста.
        '''
        return self.objects[0].__class__.__name__ if self.objects else ''
    
#===============================================================================
# Параметры запроса
#===============================================================================

class RequestParamEnum(BaseEnumerate):
    '''
    Перечисление параметров запроса
    '''
    STRING = 1
    FILE = 2

class RequestParam(object):
    '''
    Параметр запроса
    '''
    def __init__(self, name, value=None, type=RequestParamEnum.STRING):
        self.name = name
        self.value = value
        self.type = type
        
    def raw_param(self):
        '''
        Используется для получения представления параметра в "сыром" виде
        '''
        return (self.name, self.value)
    
    def finalize(self):
        pass
        
class StringParam(RequestParam):
    '''
    Параметр типа "строка"
    '''
    
    def __init__(self, name, value=''):
        super(StringParam, self).__init__(name=name, value=value, type=RequestParamEnum.STRING)
        
        
class FileParam(RequestParam):
    '''
    Параметр типа "Файл"
    '''
    def __init__(self, name, path):
        super(FileParam, self).__init__(name=name, value=path, type=RequestParamEnum.FILE)
        
        self._fileobj = None
        
    def raw_param(self):
        self._fileobj = open
        return (self.name, open(self.path, 'rb'))
    
    def finalize(self):
        if self._fileobj:
            self._fileobj.close()
            