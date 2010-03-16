#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent

class BaseExtField(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtField, self).__init__(*args, **kwargs)
        self.label = ''
        self.name = ''
        self.value = ''
        self.label_style = {}
   
    def render_label_style(self):
       return ';'.join(['%s:%s' % (k, v) for k, v in self.label_style.items()])