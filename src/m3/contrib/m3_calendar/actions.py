#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''

from m3.ui.actions.dicts.simple import BaseDictionaryModelActions

from models import ExceptedDay

class ExceptedDay_DictPack(BaseDictionaryModelActions):
    '''
    Пакет действий для справочника праздничных и перенесенных дней
    '''
    url = '/excepted-days'
    shortname = 'm3-calendar.excepted-days'
    
    model = ExceptedDay
    
    list_columns = [('day', 'Дата', 100),
                    ('name', 'Название', 300),
                    ('type', 'Тип', 300),]
    filter_field = ['name',]
    list_sort_order = ['-day',]
    
    width, height = 700, 400