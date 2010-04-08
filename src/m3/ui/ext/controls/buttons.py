#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtControl
from m3.ui.ext.misc import ExtConnection

class ExtButton(BaseExtControl):
    '''Кнопка'''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-simple-button.js'
        self.text = None
        self.handler = None
        self.icon = None
        self.icon_cls = None
        
        self.tooltip_title = None
        self.tooltip_text = None
        
        self.init_component(*args, **kwargs)
    
    def t_render_handler(self):
        if isinstance(self.handler, ExtConnection):
            return 'function(){%s}'% self.handler.render()
        else:
            return self.handler
        
    def t_render_tooltip(self):
        res = ''
        if self.tooltip_text:
            res += 'text: "%s"' % self.tooltip_text 
        if self.tooltip_title:
            res += ',title: "%s"' % self.tooltip_title 
        return '{%s}' % res
