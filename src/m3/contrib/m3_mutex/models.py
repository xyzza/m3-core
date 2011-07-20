#coding:utf-8
'''
Created on 18.07.2011

@author: akvarats
'''

from django.db import models

class Mutex(models.Model):
    '''
    Модель хранения информации о семафоре
    '''
    
    # информация о семафоре
    mutex_group = models.CharField(max_length=100, blank=True)
    mutex_class = models.CharField(max_length=100, blank=True)
    mutex_id = models.CharField(max_length=100)
        
    # информация о владельце семафора
    owner_id = models.CharField(max_length=40, default='system')
    owner_login = models.CharField(max_length=40, blank=True)
    owner_username = models.CharField(max_length=100, blank=True)
    owner_host = models.CharField(max_length=40, blank=True)
    
    # условие автоосвобождения
    auto_release_condition = models.CharField(max_length=100, blank=True)
    auto_release_config = models.CharField(max_length=300, blank=True)
    
    # служебная информация
    captured_since = models.DateTimeField()
    
    class Meta:
        db_table = 'm3_mutex'