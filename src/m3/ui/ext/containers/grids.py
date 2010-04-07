#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtPanel
from django.utils.datastructures import SortedDict


class ExtGrid(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-grid.js'
        self._items = []
        self.store = None
        self.editor = False
        self.init_component(*args, **kwargs)
        
        # protected
        self.show_banded_columns = False
        self.banded_columns = SortedDict()
    
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
        return self.t_render_items()
    
    def t_render_store(self):
        assert self.store, 'Store is not define'
        return self.store.render([column.data_index for column in self.columns])
    
    def add_column(self, **kwargs):
        self.columns.append(ExtGridColumn(**kwargs))
    
    def add_bool_column(self, **kwargs):
        self.columns.append(ExtGridBooleanColumn(**kwargs))
        
    def add_number_column(self, **kwargs):
        self.columns.append(ExtGridNumberColumn(**kwargs))
        
    def add_date_column(self, **kwargs):
        self.columns.append(ExtGridDateColumn(**kwargs))
        
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
        
    def set_store(self, store):
        self.store = store

    @property
    def columns(self):
        return self._items

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
    
    
class BaseExtGridColumn(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)
        self.header = None
        self.sortable = False
        self.data_index = None
        self.align = None
        self.width = None
        self.editor = None
               
    def render_editor(self):
        return self.editor.render()
    
#    @property
#    def editor(self):
#        return self.__editor
#    
#    @editor.setter
#    def editor(self, value):
#        assert isinstance(value, BaseExtField), 'Type value "%s" isn\'t %s' % (value, BaseExtField.__name__)
#        self.__editor = value 
        
    
class ExtGridColumn(BaseExtGridColumn):
    def __init__(self, *args, **kwargs):
        super(ExtGridColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-grid-column.js'
        self.init_component(*args, **kwargs)
    
class ExtGridBooleanColumn(BaseExtGridColumn):
    def __init__(self, *args, **kwargs):
        super(ExtGridBooleanColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-bool-column.js'
        self.text_false = None
        self.text_true = None
        self.text_undefined = None
        self.init_component(*args, **kwargs)
        
class ExtGridNumberColumn(BaseExtGridColumn):
    def __init__(self, *args, **kwargs):
        super(ExtGridNumberColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-number-column.js'
        self.format = None
        self.init_component(*args, **kwargs)
        
class ExtGridDateColumn(BaseExtGridColumn):
    def __init__(self, *args, **kwargs):
        super(ExtGridDateColumn, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-date-column.js'
        self.format = None
        self.init_component(*args, **kwargs)
