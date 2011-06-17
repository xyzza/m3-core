#coding: utf-8
'''
Created on 17.06.2011

@author: prefer
'''

from django.db import models

class Query(models.Model):
    
    # Название запроса
    name = models.CharField(max_length=100, db_index=True)
    
    # Json представление запроса
    query_json = models.TextField() 
    
    
    class Meta():
        db_table = 'm3_query_builder'