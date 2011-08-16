#coding: utf-8
'''
Created on 17.06.2011

@author: prefer
'''

from django.db import models

from entity import Param, BaseEntity  

class Query(models.Model):
    '''
    Модель для запросов
    '''
    # Название запроса
    name = models.CharField(max_length=100, db_index=True)
    
    # Json представление запроса
    query_json = models.TextField()
    
    # Тип выводимых данных
    use_dict_result = models.BooleanField (choices=BaseEntity.TYPE_RESULT.items())
        
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


class ReportParams(models.Model):
    '''
    Модель для параметров
    '''
    # Ссылка на отчет
    report = models.ForeignKey(Report) 
    
    # Название параметра
    name = models.CharField(max_length=100, db_index=True)
    
    # Название параметра
    verbose_name = models.CharField(max_length=100, db_index=True)
    
    # Тип параметра
    type = models.SmallIntegerField(choices=Param.VALUES.items())
    
    # Значение параметра
    value = models.CharField(max_length=300)
    
    # Условие для работы параметра
    condition = models.CharField(max_length=30)
    
    class Meta():
        db_table = 'm3_report_builder_params'