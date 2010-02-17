#coding:utf-8

from django.db import models 

class StoredLicKey(models.Model):
    '''
    Хранит информацию о лицензионном ключе.
        date_added - дата добавления ключа
        body - тело ключа   
    '''
    date_added = models.DateTimeField(auto_now_add=True)
    body = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'm3_licensing_stored_lic_key'
    

    