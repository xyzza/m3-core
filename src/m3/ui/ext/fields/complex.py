#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField

class DictionaryField(BaseExtField):
    '''
    Поле с выбором из справочника
    '''
    def __init__(self, *args, **kwargs):
        super(DictionaryField, self).__init__(*args, **kwargs)