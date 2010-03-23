#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''

from base_store import BaseExtStore
from m3.ui.ext import render_component

class ExtDataStore(BaseExtStore):
    def __init__(self, data = [], *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)
        self.data = data # По умолчанию первым параметром передаются данные на заполнение store
        self.template = 'ext-misc/ext-data-store.js'
        self.__columns = [] # Для заполнения полей в шаблоне
        self.init_component(*args, **kwargs)
        
    def load_data(self, data):
        self.data = data
        
    def render(self, columns):
        self.__columns = columns
        return render_component(self)
    
    def t_render_fields(self):
        '''
            Прописывается в шаблоне и заполняется при рендеринге
        '''
        return ','.join(['{name: "%s"}' % column.data_index for column in self.__columns]) 
    
    def t_render_data(self):
        '''
            Прописывается в шаблоне и заполняется при рендеринге
        '''
        res = []
        for item in self.data:    
            res.append('[%s]' % ','.join(['"%s"' % subitem for subitem in item]))   
        return ','.join(res)
            
    
class ExtJsonStore(BaseExtStore):
    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-json-store.js'
        self.__columns = [] # Для заполнения полей в шаблоне
        self.url = ''
        self.auto_load = False
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        self.__columns = columns
        return render_component(self)
        
    def t_render_fields(self):
        '''
            Прописывается в шаблоне и заполняется при рендеринге
        '''
        return ','.join(['{name: "%s"}' % column.data_index for column in self.__columns]) 
        