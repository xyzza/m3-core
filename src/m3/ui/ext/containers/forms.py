#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.fields.base import BaseExtField
from base import BaseExtPanel
from m3.ui.ext import render_component

class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = ''
        self.__items = []
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def t_render_items(self):
        return ','.join([item.render() for item in self.items])
    
    @property
    def items(self):       
        return self.__items


class ExtPanel(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-panel.js'
        self.padding = ''
        self.__items = []
        self.init_component(*args, **kwargs)
    
    def render(self):
        return render_component(self)
    
    def render_items(self): 
        return ','.join([item.render() for item in self.items])    
    
    @property
    def items(self):
        return self.__items

    
class ExtTabPanel(BaseExtPanel):
    '''
        Класс, отвечающий за работу TabPanel
    '''
    class Tabs(list):
        '''
            Вспомогательный класс, перекрывает три метода - добавление (append, insert) и изменение атрибута
            Атрибут должен быть всегда типом panel
        '''
        def __setitem__(self, key, value):
            if isinstance(value, ExtPanel):
                super(ExtTabPanel.Tabs, self).__setitem__(key, value)
            else:
                raise TypeError('Value type "%s" isn\'t ExtPanel!' % value)
            
        def append(self, value):
            if isinstance(value, ExtPanel):
                super(ExtTabPanel.Tabs, self).append(value)
            else:
                raise TypeError('Value type "%s" isn\'t ExtPanel!' % value)       
    
        def insert(self, value):
            if isinstance(value, ExtPanel):
                super(ExtTabPanel.Tabs, self).insert(value)
            else:
                raise TypeError('Value type "%s" isn\'t ExtPanel!' % value)  
    
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self.__tabs = ExtTabPanel.Tabs()
        self.init_component(*args, **kwargs)
    
    def render(self):
        return render_component(self)
    
    def render_tabs(self): 
        return ','.join([tab.render() for tab in self.tabs])
    
#    def add_tab(self, panel, index=-1):
#        if index<0 or index>len(self.tabs):
#            self.tabs.append(panel)
#        else:    
#            self.tabs.insert(index, panel)
    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel
    
# По факту метод гет здесь не нужен, т.к.определяем свойство tabs
#    def get_tab(self, index=-1):
#        if index<0 or index>len(self.tabs):
#            return self.tabs[len(self.tabs)-1]
#        else:
#            return self.tabs[index] 
#    def get_tab(self, index):
#        return self.tabs[index]

    @property
    def tabs(self):
        return self.__tabs