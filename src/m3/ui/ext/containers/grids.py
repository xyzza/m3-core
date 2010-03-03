#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.fields.base import BaseExtField
from base import BaseExtPanel
from m3.ui.ext import render_component

class ExtGrid(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-grid.js'
        self.columns = []
        self.store = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_columns(self):
        return ','.join([column.render() for column in self.columns])
    
    def render_store(self):
        return self.store.render(self.columns)
    
    def add_column(self,**kwargs):
        self.columns.append(ExtGridColumn(**kwargs))
        
    def add_store(self, store):
        self.store = store
    
    
class ExtGridColumn(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(ExtGridColumn, self).__init__(*args, **kwargs)
        self.header = ''
        self.sortable = ''
        self.data_index = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
        js = 'id: "%s"' % self.client_id
        js += '' if not self.header else ',header: "%s"' % self.header
        js += '' if not self.sortable else ',sortable: "%s"' % self.sortable
        js += '' if not self.data_index else ',dataIndex: "%s"' % self.data_index 
        return '{%s}' % js
        
        