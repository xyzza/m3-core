#coding:utf-8
'''
Created on 16.08.2011

@author: akvarats
'''

from django.conf import settings

from exceptions import NoTransportsException

def get_transport_urls():
    '''
    Возвращает IP адреса транспортов, которые используются для отдачи
    информации в информационную шину (стороннюю информационную систему)
    '''
    if not (hasattr(settings, 'TRANSPORTS') and settings.TRANSPORTS):
        raise NoTransportsException(u'В conf файле проекта не задана настройка ни один транспортный сервер.')
        
    return settings.TRANSPORTS if isinstance(settings.TRANSPORTS, list) else [settings.TRANSPORTS,]
        