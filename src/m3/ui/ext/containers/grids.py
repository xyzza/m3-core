#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtPanel
from m3.ui.ext import render_component
from django.utils.datastructures import SortedDict

class ExtGrid(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-grid.js'
        self.columns = []
        self.store = ''
        
        self.init_component(*args, **kwargs)
        
        # protected
        self.show_banded_columns = False
        self.banded_columns = SortedDict()
        
        
    def render(self):
        return render_component(self)
    
    def t_render_banded_columns(self):
        '''
        Возвращает JS массив состоящий из массивов с описанием объединенных колонок.
        Каждый вложенный массив соответствует уровню шапки грида от верхней к нижней. 
        '''
        result = []
        for level_list in self.banded_columns.values():       
            result.append('[%s]' % ','.join([ column.render() for column in level_list ]))
        return '[%s]' % ','.join(result) 

    
    def t_render_columns(self):
        return ','.join([column.render() for column in self.columns])
    
    def t_render_store(self):
        return self.store.render(self.columns)
    
    def add_column(self, **kwargs):
        self.columns.append(ExtGridColumn(**kwargs))
        
    def add_banded_column(self, column, level, colspan):
        '''
        Добавляет в грид объединенную ячейку.
        @param column: Колонка грида (ExtGridColumn)
        @param colspan: Количество колонок которые находятся под данной колонкой (int) 
        @param level: Уровень учейки где 0 - самый верхний, 1-ниже, и т.д. (int)
        '''
        assert isinstance(level, int)
        assert isinstance(colspan, int)
        assert isinstance(column, ExtGridColumn)
        # Колонки хранятся в списках внутки сортированного словаря, чтобы их можно было
        # извечь по возрастанию уровней 
        column.colspan = colspan
        level_list = self.banded_columns.get(level, [])
        level_list.append(column)
        self.banded_columns[level] = level_list
        self.show_banded_columns = True
        
    def clear_banded_columns(self):
        '''
        Удаляет все объединенные колонки из грида
        '''
        self.banded_columns.clear()
        self.show_banded_columns = False
        
    def add_store(self, store):
        self.store = store
     
    def t_get_listeners(self):
       ''' Инкапсуляция над _listeners. Используется из шаблонов! '''
       return self._listeners
       
    #//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
    # Врапперы над событиями listeners[...]
    #------------------------------------------------------------------------
    @property
    def handler_contextmenu(self):
        return self._listeners.get('contextmenu')
    
    @handler_contextmenu.setter
    def handler_contextmenu(self, menu):
        menu.container = self
        self._listeners['contextmenu'] = menu
        
    @property
    def handler_rowcontextmenu(self):
        return self._listeners.get('rowcontextmenu')
    
    @handler_rowcontextmenu.setter
    def handler_rowcontextmenu(self, menu):
        menu.container = self
        self._listeners['rowcontextmenu'] = menu
    #----------------------------------------------------------------------------
    
    
class ExtGridColumn(ExtUIComponent):
    
    def __init__(self, *args, **kwargs):
        super(ExtGridColumn, self).__init__(*args, **kwargs)
        self.header = ''
        self.sortable = ''
        self.data_index = ''
        self.align = ''
        self.colspan = ''
        self.width = 150
        self.init_component(*args, **kwargs)
        
    def render(self):
        js = 'id: "%s"' % self.client_id
        if self.header:
            js += ',header: "%s"' % self.header
        if self.sortable:
            js += ',sortable: "%s"' % self.sortable
        if self.data_index:
            js += ',dataIndex: "%s"' % self.data_index
        if self.align:
            js += ',align: "%s"' % self.align
        if self.colspan:
            js += ',colspan: %s' % self.colspan
        if self.width:
            js += ',width: %s' % self.width
        return '{%s}' % js
        
        