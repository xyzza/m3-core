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
    Просто кнопка
    '''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-simple-button.js'
        self.text = ''
        self.handler = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
#        js = ''
#        js += '{text:' + '"' + self.text + '"'
#        if self.handler_pressed:
#            js += ',handler:' + self.handler_pressed
#        return js + '}'
#        return '{xtype: "button", text: "%s" %s}' \
#            % ((self.text, '') if not self.handler_pressed else (self.text, ',handler: %s' % self.handler_pressed))
        return render_component(self)
    
    def render_handler(self):
        if type(self.handler) is ExtConnection:
            return 'function(){%s}'% self.handler.render()
        else:
            return self.handler
