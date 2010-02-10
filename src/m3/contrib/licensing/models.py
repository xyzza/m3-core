#coding:utf-8

from django.db import models 

class StoredLicKey(models.Model):
    '''
        Хранит информацию о лицензионном ключе.
    '''
    date_added = models.DateTimeField(auto_now_add=True)
    body = models.TextField(null=True, blank=True)
    

    