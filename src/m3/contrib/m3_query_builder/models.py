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
            

    @staticmethod
    def get_type_choices():
        return (
            (TypeField.STRING_FIELD, u'Текстовое поле'),
            (TypeField.NUMBER_FIELD, u'Числовое поле'),
            (TypeField.DICTIONARY_FIELD, u'Выбор из справочника'),    
        )
        

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
        
#REPORT_TYPE_CHOICES = (
#    (0, 'xls'),
#    (1, 'pdf'),                       
#)
        
class Report(models.Model):
    '''
    Модель для отчетов
    '''
    # Название отчета
    name = models.CharField(max_length=100, db_index=True)
    
    # Json представление запроса
    query = models.ForeignKey(Query) 
#    
#    # Тип отчета
#    type = models.CharField(max_length=1, choices=REPORT_TYPE_CHOICES)
#
#    # Генерировать ли дополнительное окно с html информацией
#    html_window = models.BooleanField(default=False)
        
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
    
    # Тип параметра
    type = models.CharField(max_length=1, choices=TypeField.get_type_choices())
    
    # Значение параметра
    value = models.CharField(max_length=300)
    
    class Meta():
        db_table = 'm3_report_builder_params'