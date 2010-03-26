#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.fields.base import BaseExtField
from base import BaseExtPanel

class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = None
        self.url = None
        self.__items = []
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
        self.__items = []
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
    class Tabs(list):
        '''
            Вспомогательный класс, перекрывает три метода - добавление (append, insert) и изменение атрибута
            Атрибут должен быть всегда типом panel
        '''
        def __init__(self, type):
            super(ExtTabPanel.Tabs, self).__init__()
            self.__type = type
            
        def __setitem__(self, key, value):
            assert isinstance(value, self.__type), 'Type value "%s" isn\'t %s!' % (value, self.__type.__name__)
            super(ExtTabPanel.Tabs, self).__setitem__(key, value)
     
        def append(self, value):
            assert isinstance(value, self.__type), 'Type value "%s" isn\'t %s!' % (value, self.__type.__name__)
            super(ExtTabPanel.Tabs, self).append(value)
    
        def insert(self, num, value):
            assert isinstance(value, self.__type), 'Type value "%s" isn\'t %s!' % (value, self.__type.__name__)
            super(ExtTabPanel.Tabs, self).insert(num, value)

    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self.__tabs = ExtTabPanel.Tabs(type = ExtPanel)
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