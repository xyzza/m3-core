#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
from django.conf import settings
from django.utils.datastructures import SortedDict

from m3.ui.ext.base import ExtUIComponent, BaseExtComponent
from base import BaseExtPanel


class ExtGrid(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-grid.js'
        self._items = []
        self.__store = None
        self.editor = False
        self.load_mask = False
        self.drag_drop = False
        self.drag_drop_group = None
        self.force_fit = True
        # selection model
        self.__sm = None
        # Колонка для авторасширения
        self.auto_expand_column = None
        # устанавливается True, если sm=CheckBoxSelectionModel. Этот флаг нужен
        # чтобы знать когда нужен дополнительный column
        self.__checkbox = False
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
        return ','.join(result) 
    
    def t_render_columns(self):
        return self.t_render_items()
    
    def t_render_store(self):
        assert self.__store, 'Store is not define'
        return self.__store.render([column.data_index for column in self.columns])
    
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
        self.__store = store
        
    def get_store(self):
        return self.__store
    
    store = property(get_store, set_store)

    @property
    def columns(self):
        return self._items

    @property
    def sm(self):
        return self.__sm
    
    @sm.setter
    def sm(self, value):
        self.__sm = value
        self.checkbox_model = isinstance(self.__sm, ExtGridCheckBoxSelModel)
    
    def pre_render(self):
        super(ExtGrid, self).pre_render()
        if self.store:
            self.store.action_context = self.action_context
            
    #//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
    # Врапперы над событиями listeners[...]
    #------------------------------------------------------------------------
    @property
    def handler_click(self):
        return self._listeners.get('click')
    
    @handler_click.setter
    def handler_click(self, function):
        self._listeners['click'] = function
    
    @property
    def handler_dblclick(self):
        return self._listeners.get('dblclick')
    
    @handler_dblclick.setter
    def handler_dblclick(self, function):
        self._listeners['dblclick'] = function
    
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
    
    def render_base_config(self):
        res = super(ExtGrid, self).render_base_config()
        # Значения по-умолчанию:
        res += ',stripeRows: true'
        res += ',stateful: true'
        res += ',viewConfig: {%s}' % (
            'forceFit:%s' % str(self.force_fit).lower()
                                      )
        res += ',loadMask:%s' % str(self.load_mask).lower() if self.load_mask else ''
        res +=',autoExpandColumn: "%s"' % \
            self.auto_expand_column if self.auto_expand_column else ''
        res += ',enableDragDrop: %s' % str(self.drag_drop).lower() if self.drag_drop else ''
        res += ',ddGroup:"%s"' % self.drag_drop_group if self.drag_drop_group else ''
        res += ',listeners: %s' % \
            self.t_render_simple_listeners() if self._listeners else ''
        return res
    
    def render_params(self):
        res = 'menus: {contextMenu:%s, rowContextMenu: %s}' % \
            (self.handler_contextmenu.render() if self.handler_contextmenu else '""',
             self.handler_rowcontextmenu.render() if self.handler_rowcontextmenu else '""',)
        res += ',selModel:%s' % self.sm.render() if self.sm else ''
        res += ',columns: [%s]' % self.t_render_columns() if self.t_render_columns() else '' 
        res += ',plugins: {%s}' %  \
            ('bundedColumns:[%s]' % self.t_render_banded_columns() 
            if self.show_banded_columns else '')
        return res
    
class BaseExtGridColumn(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)
        self.header = None
        self.sortable = False
        self.data_index = None
        self.align = None
        self.width = None
        self.editor = None
        self.column_renderer = None
               
    def render_editor(self):
        return self.editor.render()
        
    
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
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
        except:
            self.format = 'd.m.Y'
        self.init_component(*args, **kwargs)


class BaseExtGridSelModel(BaseExtComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtGridSelModel, self).__init__(*args, **kwargs)

class ExtGridCheckBoxSelModel(BaseExtGridSelModel):
    def __init__(self, *args, **kwargs):
        super(ExtGridCheckBoxSelModel, self).__init__(*args, **kwargs)
        self.single_select = False
        self.init_component(*args, **kwargs)
        
    def render(self):
        single_sel = 'singleSelect: true' if self.single_select else ''
        return 'new Ext.grid.CheckboxSelectionModel({ %s })' % single_sel


class ExtGridRowSelModel(BaseExtGridSelModel):
    def __init__(self, *args, **kwargs):
        super(ExtGridRowSelModel, self).__init__(*args, **kwargs)
        self.single_select = False
        self.init_component(*args, **kwargs)

    def render(self):
        single_sel = 'singleSelect: true' if self.single_select else ''
        return 'new Ext.grid.RowSelectionModel({ %s })' % single_sel


class ExtGridCellSelModel(BaseExtGridSelModel):
    def __init__(self, *args, **kwargs):
        super(ExtGridCellSelModel, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)

    def render(self):
        return 'new Ext.grid.CellSelectionModel()'
    
    
class ExtAdvancedTreeGrid(ExtGrid):
    def __init__(self, *args, **kwargs):
        super(ExtAdvancedTreeGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-advanced-treegrid.js'
        self.url = None
        self.master_column_id = None
        
        # Свойства для внутреннего store:
        self.store_root = 'rows'
        
        # Свойства для внутеннего bottom bara:
        self.use_bbar = False
        self.bbar_page_size = 10
        
        self.init_component(*args, **kwargs)
    
    def t_render_columns_to_record(self):
        return ','.join(['{name:"%s"}'  % col.data_index for col in self.columns])
    
    def add_column(self, **kwargs):
        # FIXME: Хак, с сгенерированным client_id компонент отказывается работать
        if kwargs.get('data_index'):
            kwargs['client_id'] = kwargs.get('data_index')
        super(ExtAdvancedTreeGrid, self).add_column(**kwargs)
        
    def render_base_config(self):
        res = super(ExtAdvancedTreeGrid, self).render_base_config()
        res += ',master_column_id:"%s"' % self.master_column_id \
            if self.master_column_id else ''
        return res
        
    def render_params(self):
        res = super(ExtAdvancedTreeGrid, self).render_params()
        res += ',storeParams:{url:"%s", root:"%s"}' % (
                self.url if self.url else '',
                self.store_root if self.store_root else '',
                )
        res += ',columnsToRecord:[%s]' % self.t_render_columns_to_record()
        res += ',bbar:{pageSize:%s}' % self.bbar_page_size if self.use_bbar else ''
        return res
    
    def render(self):
        base_config = self.render_base_config()
        params = self.render_params()
        return 'createAdvancedTreeGrid({%s},{%s})' %(base_config, params)