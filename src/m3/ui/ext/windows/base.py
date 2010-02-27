#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext import ExtUIComponent
from m3.ui.ext import render_component

class BaseExtWindow(ExtUIComponent):
    '''
    Базовый класс для всех окон в системе
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.template='ext-windows/ext-window.js'
        
        # параметры окна
        self.width = 400
        self.height = 300
        self.title = ''
        self.top_container = None # контейнер для содержащихся на форме элементов
        self.buttons = []
        
    def render_buttons(self):
        js = 'buttons:['
        for button in self.buttons:
            js += button.as_js() + ','
        if js[-1] == ',':
            js = js[0:len(js)-1]
        return js + ']'
    
    def render(self):
        return render_component(self)