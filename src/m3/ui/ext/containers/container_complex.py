#coding:utf-8
'''
Created on 21.04.2010

@author: prefer
'''

from base import BaseExtContainer
from containers import ExtContainer
from m3.ui.ext.base import ExtUIComponent

class ExtContainerTable(BaseExtContainer):
    _DEFAULT_HEIGHT = 36
    
    def __init__(self, columns = 0, rows = 0, *args, **kwargs):
        super(ExtContainerTable, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-container.js'
        self.title = None
        self.__columns_count = 0
        self.__rows_count = 0
        self.__table = []
        self.__rows_height = {}
        self.columns_count = columns
        self.rows_count = rows
        self.init_component(*args, **kwargs)
  
    def render(self):
        for i, row in enumerate(self.__table):
            col_cont_list = []
            for col in row:
                if col!=None:
                    if isinstance(col, int):
                        col_cont_list.append(ExtContainer(layout = 'form', flex=1))
                    elif isinstance(col, ExtContainer):
                        col_cont_list.append(col)
        
            height = self.__rows_height.get(i) or ExtContainerTable._DEFAULT_HEIGHT
            row_cont = ExtContainer(layout_config = dict(align="stretch"), layout = 'hbox', height = height)
            row_cont.items.extend(col_cont_list)
            self._items.append(row_cont)
        
        return super(ExtContainerTable, self).render()
  
    @property
    def items(self):       
        return [col for row in self.__table for col in row if isinstance(col, ExtContainer)]

    
    @property
    def columns_count(self):
        return self.__columns_count
            
    @columns_count.setter
    def columns_count(self, value):
        assert isinstance(value, int), 'Value must be INT'
        self.__columns_count = value
        
        if self.__rows_count:
            self.__init_table()

    @property
    def rows_count(self):
        return self.__rows_count
            
    @rows_count.setter
    def rows_count(self, value):
        assert isinstance(value, int), 'Value must be INT'
        self.__rows_count = value
        
        if self.__columns_count:
            self.__init_table()

    def __init_table(self):
        self.__table = [list(range(self.__columns_count)) for col in range(self.__rows_count)]
        
    def set_item(self, row, col, cmp, colspan=1):
        assert isinstance(cmp, ExtUIComponent)
        assert isinstance(colspan, int)
        
        cont = ExtContainer(layout = 'form', flex=colspan, style=dict(padding="5px"))
        cmp.anchor = '100%'
        cont.items.append(cmp)
        
        self.__table[row][col] = cont
        if colspan>1:
            self.__table[row][col+1:col+colspan] = [None,]*(colspan-1)
        
    def set_row_height(self, row, height):
        assert isinstance(height, int), 'Height must be INT'
        assert isinstance(row, int), 'Row num must be INT'
        assert 0 <= row <= self.rows_count, 'Row num %d must be in range 0 to %d' % (row, self.rows_count)
        self.__rows_height[row] = height
        
    def set_default_row_height(self, row):
        assert isinstance(row, int), 'Row num must be INT'
        assert 0 <= row <= self.rows_count, 'Row num must be in range 0 to %d' % self.rows_count
        self.__rows_height[row] = ExtContainerTable._DEFAULT_HEIGHT
        
    def set_rows_height(self, height):
        assert isinstance(height, int), 'Height must be INT'
        for row in range(self.rows_count): 
            self.__rows_height[row] = height
            
    def set_default_rows_height(self):
        self.set_rows_height(ExtContainerTable._DEFAULT_HEIGHT)