#coding:utf-8
'''
Created on 16.08.2011

@author: akvarats
'''

class IBusException(Exception):
    '''
    Исключительная ситуация, которая выдается клиентом информационной шины
    '''
    pass

class NoTransportsException(Exception):
    '''
    Исключительная ситуация, которая выдается клиентом при отсутствии настройки
    на транспортные сервера.
    '''
    pass