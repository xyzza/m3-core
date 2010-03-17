#coding:utf-8
'''
Created on 15.3.2010

@author: prefer
'''

from base import BaseExtContainer
from m3.ui.ext import render_component
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.fields.base import BaseExtField

class ExtToolbar(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtToolbar, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-toolbar.js'
        self.__items = []
        self.init_component(*args, **kwargs)

    def render(self):
        return render_component(self)
    
    def render_items(self):
        res = []
        for item in self.items:
            # Если объект нашей структуры классов, то пусть сам рендерится, если нет, отдаем так как есть.
            if type(item) is str or type(item) is unicode:
                res.append(item)
            else:
                res.append(item.render())         
        return ','.join(res)
        
    def add_fill(self):
        self.items.append('"->"')
                
    def add_separator(self):
        self.items.append('"-"')
                
    def add_spacer(self, width=2):
        self.items.append("{xtype: 'tbspacer', width: %d}" % width)
                
    def add_text_item(self, text_item):
        self.items.append('"%s"' % text_item)
          
    @property
    def items(self):
        return self.__items