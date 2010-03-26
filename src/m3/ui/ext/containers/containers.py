#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.fields.base import BaseExtField

class ExtContainer(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-container.js'
        self.__items = []
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        return ','.join([item.render() for item in self.items])
    
    @property
    def items(self):
        return self.__items

class ExtToolbar(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtToolbar, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-toolbar.js'
        self.__items = []
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        res = []
        for item in self.items:
            # Если объект нашей структуры классов, то пусть сам рендерится, если нет, отдаем так как есть.
            if isinstance(item, ExtUIComponent):
                res.append(item.render()) 
            else:
                res.append(item)        
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
