#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField

class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)