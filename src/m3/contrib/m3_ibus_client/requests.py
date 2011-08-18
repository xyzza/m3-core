#coding:utf-8
'''
Реализация различных реквестов, которые используются для передачи сообщений.

Created on 15.08.2011

@author: akvarats
'''

import poster.encode

from m3.db import BaseEnumerate
from m3.misc.ibus import InteractionMode


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
        for param in self.params:
            if isinstance(param, tuple) and len(param) > 1:
                raw_params[param[0]] = param[1]
            elif isinstance(param, RequestParam):
                k,v = param.raw_param()
                raw_params[k] = v
        
        # добавляем служебные параметры в запрос
        self.params.append(StringParam('ibus-message-category', self.category))
        self.params.append(StringParam('ibus-message-mode', InteractionMode.names.get(self.mode, 'ASYNC')))
        
        datagen, headers = poster.encode.multipart_encode(raw_params)
        
        # финализируем параметры
        for param in self.params:
            if isinstance(param, RequestParam):
                param.finalize()
                
        return (datagen, headers)
    
class SingleObjectRequest(Request):
    '''
    Запрос на отправку одного объекта в транспорт
    '''
    
    def __init__(self, category, obj, obj_type='', mode=InteractionMode.ASYNC):
        '''
        В дополнение к параметрам верхнего уровня указывается:
        @param obj: объект, подлежащий отправке
        @param obj_type: наименование типа объекта, которое будет передано в запросе
        '''
        super(SingleObjectRequest, self).__init__(category=category, params=[], mode=mode)
        self.obj = obj
        self.obj_type = obj_type
        
    def encode(self):
        '''
        Переопределяем метод для того, чтобы добавить в параметры
        сериализованное представление объекта
        '''
        if self.obj:
            self.params.append(StringParam('object', self._encode_object()))
            self.params.append(StringParam('object_type', self.obj_type or self._encode_object_type()))
        return super(SingleObjectRequest, self).encode()
        
    def _encode_object(self):
        
        #FIXME пока так
        return str(self.obj)
    
    def _encode_object_type(self):
        
        #FIXME пока так
        return ''
    
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
        super(StringParam, self).__init__(name=name, value=value, RequestParamEnum.STRING)
        
        
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
            