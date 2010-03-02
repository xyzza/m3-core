#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtControl

class ExtButton(BaseExtControl):
    '''
    Просто кнопка
    '''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.text = 'Кнопка'
        
        # событие нажатия на кнопку
        self.handler_pressed = ''
        
    def as_js(self):
        js = ''
        js += '{text:' + '"' + self.text + '"'
        if self.handler_pressed:
            js += ',handler:' + self.handler_pressed
        return js + '}'