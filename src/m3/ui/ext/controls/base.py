#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''
from m3.ui.ext.base import ExtUIComponent

class BaseExtControl(ExtUIComponent):
    '''
    Базовый класс для кнопочных контролов
    
    @version: 0.1
    @begin_designer
    {
        abstract: true
    }
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtControl, self).__init__(*args, **kwargs)