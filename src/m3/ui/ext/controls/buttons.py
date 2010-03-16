#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtControl
from m3.ui.ext import render_component
from m3.ui.ext.misc import ExtConnection

class ExtButton(BaseExtControl):
    '''
        Кнопка
    '''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-simple-button.js'
        self.text = ''
        self.handler = ''
        self.icon = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_handler(self):
        if isinstance(self.handler, ExtConnection):
            return 'function(){%s}'% self.handler.render()
        else:
            return self.handler
