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
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_items(self):
        return ','.join([item.render() for item in self.items])
    
    def _get_fields(self):       
        return [item for item in self.items if issubclass(item, BaseExtField)]

    fields = property(_get_fields)

class ExtPanel(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-panel.js'
        self.width = ''
        self.init_component(*args, **kwargs)
    
    def render(self):
        return render_component(self)
    
    def render_items(self): 
        return ','.join([item.render() for item in self.items])    
    

class ExtTabPanel(ExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self.init_component(*args, **kwargs)
    
    def render(self):
        return render_component(self)
    
    def render_items(self): 
        return ','.join([item.render() for item in self.items])
    
    def add_panel(self, panel):
        self.items.append(panel)  