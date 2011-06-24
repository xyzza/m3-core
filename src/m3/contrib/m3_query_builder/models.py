#coding: utf-8
'''
Created on 17.06.2011

@author: prefer
'''

from django.db import models


class Query(models.Model):
    '''
    Модель для запросов
    '''
    # Название запроса
    name = models.CharField(max_length=100, db_index=True)
    
    # Json представление запроса
    query_json = models.TextField() 
    
    
    class Meta():
        db_table = 'm3_query_builder'
        
        
class Report(models.Model):
    '''
    Модель для отчетов
    '''
    # Название отчета
    name = models.CharField(max_length=100, db_index=True)
    
    # Json представление запроса
    query = models.ForeignKey(Query) 
        
    class Meta():
        db_table = 'm3_report_builder'
        

TYPE_CHOICES = (
    (0, 'String field'),
    (1, 'Numeric field'),
    (2, 'Dict field'),            
    (3, 'Combo field'),
)

class ReportParams(models.Model):
    '''
    Модель для параметров
    '''
    # Ссылка на отчет
    report = models.ForeignKey(Report) 
    
    # Название параметра
    name = models.CharField(max_length=100, db_index=True)
    
    # Тип параметра
    type = models.CharField(max_length=1, choices=TYPE_CHOICES)
    
    # Значение параметра
    value = models.CharField(max_length=300)
    
    class Meta():
        db_table = 'm3_report_builder_params'