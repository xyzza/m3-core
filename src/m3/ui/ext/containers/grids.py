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
        # view
        self.__view = None
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
        Возвращает JS массив состоящий из массивов с описанием объединенных 
        колонок. Каждый вложенный массив соответствует уровню шапки грида от 
        верхней к нижней. 
        '''
        result = []
        for level_list in self.banded_columns.values():       
            result.append('[%s]' % ','.join([ column.render() \
                                             for column in level_list ]))
        return ','.join(result) 
    
    def t_render_columns(self):
        return '[%s]' % self.t_render_items()
    
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
        @param colspan: Количество колонок которые находятся 
            под данной колонкой (int) 
        @param level: Уровень учейки где 0 - самый верхний, 1-ниже, и т.д. (int)
        '''
        assert isinstance(level, int)
        assert isinstance(colspan, int)
        assert isinstance(column, ExtGridColumn)
        # Колонки хранятся в списках внутки сортированного словаря, 
        #чтобы их можно было
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
    
    @property
    def view(self):
        return self.__view
    
    @view.setter
    def view(self, value):
        self.__view = value    
        
    def t_render_view(self):
        return self.view.render()
    
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
        super(ExtGrid, self).render_base_config()
        self._put_config_value('stripeRows', True)
        self._put_config_value('stateful', True) 
        self._put_config_value('loadMask', self.load_mask)    
        self._put_config_value('autoExpandColumn', self.auto_expand_column)
        self._put_config_value('enableDragDrop', self.drag_drop)
        self._put_config_value('ddGroup', self.drag_drop_group)
        self._put_config_value('view', self.t_render_view, self.view)
        self._put_config_value('autoExpandColumn', self.auto_expand_column)
        self._put_config_value('store', self.t_render_store, self.get_store())   
        self._put_config_value('viewConfig', {'forceFit':self.force_fit})
    
    def render_params(self):
        super(ExtGrid, self).render_params()
        
        handler_cont_menu = self.handler_contextmenu.render \
                        if self.handler_contextmenu else ''
            
        handler_rowcontextmenu = self.handler_rowcontextmenu.render \
                        if self.handler_rowcontextmenu else ''
        
        self._put_params_value('menus', {'contextMenu': handler_cont_menu,
                                         'rowContextMenu': handler_rowcontextmenu})
        if self.sm:
            self._put_params_value('selModel', self.sm.render)
        
        self._put_params_value('columns', self.t_render_columns)
        self._put_params_value('plugins',
                               {'bundedColumns': self.t_render_banded_columns \
                                    if self.show_banded_columns else ''})
    
    def render(self):
        self.pre_render()
        
        self.render_base_config()
        self.render_params()

        config = self._get_config_str()
        params = self._get_params_str()
        return 'createGridPanel({%s}, {%s})' % (config, params)
    
class BaseExtGridColumn(ExtUIComponent):
    GRID_COLUMN_DEFAULT_WIDTH = 100
    
    def __init__(self, *args, **kwargs):
        super(BaseExtGridColumn, self).__init__(*args, **kwargs)
        self.header = None
        self.sortable = False
        self.data_index = None
        self.align = None
        self.width = BaseExtGridColumn.GRID_COLUMN_DEFAULT_WIDTH
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
    '''
    Расширенное дерево на базе Ext.ux.maximgb.TreeGrid
    '''
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
        return '[%s]' % ','.join(['{name:"%s"}'  % col.data_index \
                                  for col in self.columns])
    
    def add_column(self, **kwargs):
        # FIXME: Хак, с сгенерированным client_id компонент отказывается работать
        if kwargs.get('data_index'):
            kwargs['client_id'] = kwargs.get('data_index')
        super(ExtAdvancedTreeGrid, self).add_column(**kwargs)
        
    def render_base_config(self):
        super(ExtAdvancedTreeGrid, self).render_base_config()
        self._put_config_value('master_column_id', self.master_column_id)
        
    def render_params(self):
        super(ExtAdvancedTreeGrid, self).render_params()
        self._put_params_value('storeParams', {'url': self.url,
                                               'root': self.store_root})
        
        self._put_params_value('columnsToRecord', self.t_render_columns_to_record)
        
        if self.use_bbar:
            self._put_params_value('bbar', {'pageSize': self.bbar_page_size})
    
    def t_render_base_config(self):
        return self._get_config_str()
    
    def render(self):
        self.render_base_config()
        self.render_params()
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedTreeGrid({%s},{%s})' %(base_config, params)

class ExtGridGroupingView(BaseExtComponent):
    '''
    Компонент используемый при группировке
    '''
    def __init__(self, *args, **kwargs):
        super(ExtGridGroupingView, self).__init__(*args, **kwargs)
        self.force_fit = True
        self.init_component(*args, **kwargs)
        
    def render(self):
        result = '''new Ext.grid.GroupingView({
            %(force_fit)s,
            %(group_text_tpl)s
        })
    '''  % {'force_fit':'forceFit:true' if self.force_fit else 'forceFit:false',
            'group_text_tpl': """groupTextTpl:'{text} ({[values.rs.length]})'"""
}
        return result
    # если требуется вывести какое-либо слово после количества, шаблон должен 
    #иметь след вид:
    # 'group_text_tpl': """groupTextTpl:'{text} ({[values.rs.length]} 
    #    {[values.rs.length > 1 ? "Объекта" : "Объект"]})'"""
    # но проблемы с обработкой двойных кавычек