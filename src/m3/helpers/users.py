#coding:utf-8
'''
Created on 20.03.2010

@author: akvarats
'''

__all__ = ()

from django.db import models
from django.contrib.auth import models as django_auth_models

class BaseUserProfile(models.Model):
    '''
    Базовый класс для профилей пользователя прикладных
    приложений
    '''
    user = models.ForeignKey(django_auth_models.User, unique = True)
    class Meta:
        abstract = True