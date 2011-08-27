#coding:utf-8
'''
Ответы на запросы 

Created on 16.08.2011

@author: akvarats
'''

import abc

class Response(object):
    '''
    Базовый класс для упаковки параметров ответов сервера.
    '''
    __metaclass__ = abc.ABCMeta
    
    def __init__(self):
        self.code = 200
        self.http_message = 'OK'
    
    @abc.abstractmethod
    def content(self):
        '''
        Метод, который возвращает внутреннее содержание запроса. В зависимости от
        типа запроса (дочернего класса), данный метод потенциально может
        '''
        pass


class PingResponse(Response):
    '''
    Ответ, приходящий на запрос PING
    '''
    def __init__(self, result=True):
        super(PingResponse, self).__init__()
        self.result = True
        
    def content(self):
        return self.result

    
class AsyncResponse(Response):
    '''
    Прямой ответ на асинхронный запрос. 
    
    Метод content возвращает идентификатор зарегистрированного 
    сообщения транспортным сервером сообщения.
    '''
    def __init__(self, message_id=''):
        super(AsyncResponse, self).__init__()
        self.message_id = message_id
        
    def content(self):
        return self.message_id