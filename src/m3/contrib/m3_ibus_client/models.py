#coding:utf-8
'''
Created on 11.08.2011

@author: akvarats
'''

from django.db import models

class AsyncRequestToken(models.Model):
    '''
    Модель хранения меток асинхронных запросов в транспортный сервер
    '''
    token = models.CharField(max_length=100, blank=False)
    
    # описание того, что нужно вызвать, когда придет callback
    # в ответ на асинхронный запрос
    target = models.TextField()
    
    # признак того, что данная метка была обработана
    handled = models.BooleanField(default=False)
    
    # timestamp на создание метки
    created = models.DateTimeField(auto_now_add=True)
    
    # время жизни токена (в часах)
    livetime = models.PositiveIntegerField(default=48)
    
    class Meta:
        db_table = 'ibus_request_tokens'

class CallbaclRequestToken(models.Model):
    '''
    Модель для хранения запросов, которые будут забираться транспортом с помощью обратного
    вызова.
    '''
    
    class Meta:
        db_table = 'ibus_request_callbacks'
    