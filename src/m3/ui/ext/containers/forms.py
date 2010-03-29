#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.fields.base import BaseExtField

from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from base import BaseExtPanel
from m3.ui.ext.base import ExtUIComponent

class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = None
        self.url = None
        self.__items = TypedList(type=ExtUIComponent)
        # Параметры специфичные для layout form
        self.label_width = self.label_align = self.label_pad = None
        
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        return ','.join([item.render() for item in self.items])
    
    @property
    def items(self):       
        return self.__items

class ExtPanel(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-panel.js'
        self.padding = None
        self.__items = TypedList(type=ExtUIComponent)
        self.init_component(*args, **kwargs)
    
    def render_items(self): 
        return ','.join([item.render() for item in self.items])    
    
    @property
    def items(self):
        return self.__items

    
class ExtTabPanel(BaseExtPanel):
    '''
        Класс, отвечающий за работу TabPanel
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self.__tabs = TypedList(type=ExtPanel)
        self.init_component(*args, **kwargs)
    
    def render_tabs(self): 
        return ','.join([tab.render() for tab in self.tabs])
    
    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel

    @property
    def tabs(self):
        return self.__tabs
