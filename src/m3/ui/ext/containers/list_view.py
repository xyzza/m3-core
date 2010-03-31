#coding:utf-8
'''
Класс list view в соответствии с Ext.list.ListView

Created on 31.03.2010

@author: prefer
'''

from base import BaseExtPanel
from m3.ui.ext.containers import (ExtGridColumn, 
                              ExtGridBooleanColumn, 
                              ExtGridDateColumn, 
                              ExtGridNumberColumn)

class ExtListView(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtListView, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-list-view.js'
        self.multi_select = False
        self.empty_text = None
        self.__store = None
        self.columns = []
        self.init_component(*args, **kwargs)
        
    def set_store(self, store):
        self.__store = store
        
    def t_render_columns(self):
        return ','.join([column.render() for column in self.columns])
    
    def t_render_store(self):
        return self.__store.render([column.data_index for column in self.columns])
    
    def add_column(self, **kwargs):
        self.columns.append(ExtGridColumn(**kwargs))
    
    def add_bool_column(self, **kwargs):
        self.columns.append(ExtGridBooleanColumn(**kwargs))
        
    def add_number_column(self, **kwargs):
        self.columns.append(ExtGridNumberColumn(**kwargs))
        
    def add_date_column(self, **kwargs):
        self.columns.append(ExtGridDateColumn(**kwargs))