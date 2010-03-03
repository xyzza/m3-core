#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''

from m3.ui.ext.base import ExtUIComponent

class BaseExtStore(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtStore, self).__init__(*args, **kwargs)