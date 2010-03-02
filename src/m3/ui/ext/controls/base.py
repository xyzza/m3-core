#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''
from m3.ui.ext.base import ExtUIComponent

class BaseExtControl(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtControl, self).__init__(*args, **kwargs)