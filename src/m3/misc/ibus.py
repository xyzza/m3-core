#coding:utf-8
'''
Created on 16.08.2011

@author: akvarats
'''

class ServerUrls(object):
    '''
    Перечисление урлов, которые используются при отсылке запросов с клиента в транспортный сервер.
    '''
    
    # 
    SEND_MESSAGE = 'message/send'
    PING = 'ping'
    

class ClientUrls(object):
    '''
    Перечисление урлов, которые используются при отсылке запросов с транспортного сервера (интеграционной шины)
    клиентам.
    '''
    pass


PING_SUCCESSFUL_REQUEST = 'pong'