#coding:utf-8
'''
Created on 11.08.2011

@author: akvarats
'''
from django.utils.translation import ugettext as _
from m3.db import BaseEnumerate

class InteractionMode(BaseEnumerate):
    '''
    Перечисление режимов взаимодействий, в которые вступают клиент и транспортный сервер
    '''
    SYNC = 1
    ASYNC = 2
    
    values = { SYNC: _(u'Синхронный режим'),
               ASYNC: _(u'Асинхронный режим'),}
    
    names = { SYNC: 'SYNC',
              ASYNC: 'ASYNC',}
    
