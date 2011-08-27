#coding:utf-8
'''
Created on 16.08.2011

@author: akvarats
'''

from django.conf import settings

from exceptions import IncompleteIBusSettings

def get_transport_urls():
    '''
    Возвращает IP адреса транспортов, которые используются для отдачи
    информации в информационную шину (стороннюю информационную систему)
    '''
    if not (hasattr(settings, 'IBUS_TRANSPORTS') and settings.IBUS_TRANSPORTS):
        raise IncompleteIBusSettings(u'В conf файле проекта не задана настройка ни один транспортный сервер (IBUS_TRANSPORTS)')
        
    return settings.IBUS_TRANSPORTS if isinstance(settings.IBUS_TRANSPORTS, list) else [settings.IBUS_TRANSPORTS,]

def get_sender():
    '''
    Возвращает отправителя, как он задан в conf файле приложения.
    
    Если отправитель не задан, то вбрасывается исключение типа Incomplete
    '''
    if not (hasattr(settings, 'IBUS_SENDER') and settings.IBUS_SENDER):
        raise IncompleteIBusSettings(u'В conf файле приложения не задано наименование отправителя (IBUS_SENDER)')
        
    return settings.IBUS_SENDER