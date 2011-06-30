#coding: utf-8
'''
Created on 17.06.2011

@author: prefer
'''

from django.db import models


class TypeField(object):
    '''
    Класс для данных типов полей
    '''
    
    STRING_FIELD = 1
    NUMBER_FIELD = 2    
    DICTIONARY_FIELD =3
    DATE_FIELD = 4
    BOOLEAN_FIELD = 5
    
    VALUES = {
        STRING_FIELD: u'Текст',
        NUMBER_FIELD: u'Число',
        DICTIONARY_FIELD: u'Выбор из справочника',
        DATE_FIELD: u'Дата',
        BOOLEAN_FIELD: u'Флаг',
    }

    @staticmethod
    def get_type_choices():
        return [ (k, v) for k, v in  TypeField.VALUES.items()]
        

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
    type = models.SmallIntegerField(choices=TypeField.get_type_choices())
    
    # Значение параметра
    value = models.CharField(max_length=300)
    
    class Meta():
        db_table = 'm3_report_builder_params'