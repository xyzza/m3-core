#coding:utf-8
'''
Created on 21.04.2010

@author: prefer
'''

from base import BaseExtPanel

class ExtFormTable(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtFormTable, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-table-form.js'
        self.url = None
        self.__columns_count = 0
        self.__rows_count = 0
        self.__table = []
        self.init_component(*args, **kwargs)
        
    @property
    def items(self):       
        return self._items
    
    @property
    def columns_count(self):
        return self.__columns_count
            
    @columns_count.setter
    def columns_count(self, value):
        self.__columns_count = value
        
        if self.__rows_count:
            self.__init_table()

    @property
    def rows_count(self):
        return self.__rows_count
            
    @rows_count.setter
    def rows_count(self, value):
        self.__rows_count = value
        
        if self.__columns_count:
            self.__init_table()

    def __init_table(self):
        self.__table = [list(range(self.__rows_count)) for col in range(self.__columns_count)]
