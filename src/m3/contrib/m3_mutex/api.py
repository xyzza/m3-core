#coding:utf-8
'''
Created on 14.07.2011

@author: akvarats
'''

from domain import TimeoutAutoRelease, MutexQuery

def capture_mutex(mutex_id, owner=None, auto_release=TimeoutAutoRelease(timeout=300)):
    '''
    Устанавливает семафор с таймаутом в 300 секунд (5 минут) по умолчанию
    '''
    pass

def release_mutex(mutex_id, owner):
    '''
    Освобождает семафор
    '''
    pass

def request_mutex(mutex_id, owner):
    '''
    Проверяет, свободен ли семафор.
    '''
    pass

def get_mutex_list(mutex_query=MutexQuery()):
    '''
    Возвращает список семафоров с условием отбора,
    заданным в mutex_query
    '''
    return []

