#coding: utf-8

'''
Created on 9.03.10

@author: prefer
'''

from base import BaseExtWindow
from m3.ui.ext.fields import ExtSearchField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import (ExtContextMenu,
                                ExtPanel,
                                ExtListView, 
                                ExtToolBar, 
                                ExtTree,
                                ExtGrid)
        
                
class ExtDictionaryWindow(BaseExtWindow):
    LIST_MODE = 0
    SELECT_MODE = 1
    ''' Базовое окно для линейного, иерархичесого и совмещенного справочника'''
    def __init__(self, *args, **kwargs):
        super(ExtDictionaryWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.template_globals = 'ext-script/ext-dictionary-window-globals.js'
        self.layout='border'
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))

        # Основные контролы должны быть доступны для изменения
        self.grid = None
        self.tree = None
       
        self.list_view = None
        self.search_text_grid = None
        self.search_text_tree = None
        self.select_button = None
        self.__panel_list_view = None
        
        # Окно может находится в двух положениях: просто список записей и список выбора записи/записей
        self.__mode = 0 # По умолчанию справочник открыт в режиме списка
     
        # Компоненты для различных действий для грида
        self.__components_new_grid = None
        self.__components_edit_grid = None
        self.__components_delete_grid = None
        self.__components_refresh_grid = None
        
        # Компоненты для различных действий для дерева
        self.__components_new_tree = None
        self.__components_new_tree_child = None
        self.__components_edit_tree = None
        self.__components_delete_tree = None
        self.__components_refresh_tree = None
        
        # Вызываемые url для грида
        self.__url_new_grid = None
        self.__url_edit_grid = None
        self.__url_delete_grid = None
        self.__url_drag_grid = None
        
        # Вызываемые url для дерева
        self.__url_new_tree = None
        self.__url_edit_tree = None
        self.__url_delete_tree = None
        self.__url_drag_tree = None
        
        self.__column_name_on_select = None
        self.maximizable = True
        self.minimizable = True
        
        self.contextTreeIdName = 'id'
        self.init_component(*args, **kwargs)
        
    @property
    def mode(self):
        return self.__mode
    
    @mode.setter
    def mode(self, value):
        assert value in (ExtDictionaryWindow.LIST_MODE, ExtDictionaryWindow.SELECT_MODE), 'Mode only 1 (select mode) or 0 (list mode)'

        if value == ExtDictionaryWindow.SELECT_MODE:
            
            # панель с историей выбора пока отключена
            button_panel = ExtPanel(title='История выбора',
                                region='south',min_height=100, collapsible=True, split=True)
            list_view = ExtListView() 
            button_panel.items.append(list_view)
#            self.items.append(button_panel)

            self.__panel_list_view = button_panel
            self.list_view = list_view
        
            select_btn = ExtButton(text = u'Выбрать', disabled=True)
            self.buttons.insert(0, select_btn)
            
            self.select_button = select_btn
            
        elif value == ExtDictionaryWindow.LIST_MODE:
            
            if self.__panel_list_view:
                self.items.remove(self.__panel_list_view)
                self.list_view = None
                self.__panel_list_view = None
            if self.select_button:
                self.buttons.remove(self.select_button)
                self.select_button = None

        self.__mode = value
        
    def _add_menu_item_grid(self, to_tbar = True, to_row_menu = True, to_grid_menu = True, to_menu = None, **kwargs):
        '''
        Добавление контролов управления в грид
        '''
        ret = []
        if to_menu:
            to_menu.add_item(**kwargs)
            ret.append(to_menu.items[len(to_menu.items)-1])
        if to_tbar:
            self.grid.top_bar.items.append(ExtButton(**kwargs))
            ret.append(self.grid.top_bar.items[len(self.grid.top_bar.items)-1])
        if to_row_menu:
            self.grid.handler_rowcontextmenu.add_item(**kwargs)
            ret.append(self.grid.handler_rowcontextmenu.items[len(self.grid.handler_rowcontextmenu.items)-1])
        if to_grid_menu:
            self.grid.handler_contextmenu.add_item(**kwargs)
            ret.append(self.grid.handler_contextmenu.items[len(self.grid.handler_contextmenu.items)-1])
        return ret
        
    def _add_separator_grid(self, to_tbar = True, to_row_menu = True, to_grid_menu = True, to_menu = None):
        '''Добавление разделителя в контролы грида'''
        if to_menu:
            to_menu.add_separator()
        if to_tbar:
            self.grid.top_bar.add_separator()
        if to_row_menu:
            self.grid.handler_rowcontextmenu.add_separator()
        if to_grid_menu:
            self.grid.handler_contextmenu.add_separator()
            
    def _add_menu_item_tree(self, to_tbar = True, to_node_menu = True, to_tree_menu = True, to_menu = None, **kwargs):
        '''
        Добавление контролов управления в дерево        
        '''
        ret = []
        if to_menu:
            to_menu.add_item(**kwargs)
            ret.append(to_menu.items[len(to_menu.items)-1])
        if to_tbar:
            self.tree.top_bar.items.append(ExtButton(**kwargs))
            ret.append(self.tree.top_bar.items[len(self.tree.top_bar.items)-1])
        if to_node_menu:
            self.tree.handler_contextmenu.add_item(**kwargs)
            ret.append(self.tree.handler_contextmenu.items[len(self.tree.handler_contextmenu.items)-1])
        if to_tree_menu:
            self.tree.handler_containercontextmenu.add_item(**kwargs)
            ret.append(self.tree.handler_containercontextmenu.items[len(self.tree.handler_containercontextmenu.items)-1])
        return ret
        
    def _add_separator_tree(self, to_tbar = True, to_node_menu = True, to_tree_menu = True, to_menu = None):
        '''Добавление разделителя в контролы дерева'''
        if to_menu:
            to_menu.add_separator()
        if to_tbar:
            self.tree.top_bar.add_separator()
        if to_node_menu:
            self.tree.handler_contextmenu.add_separator()
        if to_tree_menu:
            self.tree.handler_containercontextmenu.add_separator()
        
    # Урлы для грида:
    @property
    def url_new_grid(self):
        return self.__url_new_grid
        
    @url_new_grid.setter
    def  url_new_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self.__components_new_grid, 'newValueGrid')
        else:
            self._clear_handler(self.__components_new_grid)
        self.__url_new_grid = value
    
    @property
    def url_edit_grid(self):
        return self.__url_edit_grid
    
    @url_edit_grid.setter
    def url_edit_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self.__components_edit_grid, 'editValueGrid')
            self.grid.handler_dblclick = 'editValueGrid'
        else:
            self._clear_handler(self.__components_edit_grid)
            self.grid.handler_dblclick = None
        self.__url_edit_grid = value 
    
    @property
    def url_delete_grid(self):
        return self.__url_delete_grid
    
    @url_delete_grid.setter
    def url_delete_grid(self, value):
        self.init_grid_components()
        if value:
            self._set_handler(self.__components_delete_grid, 'deleteValueGrid')
        else:
            self._clear_handler(self.__components_delete_grid)
        self.__url_delete_grid = value 
    
    #Урлы для дерева
    @property
    def url_new_tree(self):
        return self.__url_new_tree
        
    @url_new_tree.setter
    def  url_new_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(self.__components_new_tree, 'newValueTreeRoot')
            self._set_handler(self.__components_new_tree_child, 'newValueTreeChild')
        else:
            self._clear_handler(self.__components_new_tree)
            self._clear_handler(self.__components_new_tree_child)
        self.__url_new_tree = value
    
    @property
    def url_edit_tree(self):
        return self.__url_edit_tree
    
    @url_edit_tree.setter
    def url_edit_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(self.__components_edit_tree, 'editValueTree')
            self.tree.handler_dblclick = 'editValueTree'
        else:
            self._clear_handler(self.__components_edit_tree)
            self.tree.handler_dblclick = None
        self.__url_edit_tree = value 
    
    @property
    def url_delete_tree(self):
        return self.__url_delete_tree
    
    @url_delete_tree.setter
    def url_delete_tree(self, value):
        self.init_tree_components()
        if value:
            self._set_handler(self.__components_delete_tree, 'deleteValueTree')
        else:
            self._clear_handler(self.__components_delete_tree)
        self.__url_delete_tree = value 
    
    # Выбор из справочника
    @property
    def column_name_on_select(self):
        return self.__text_on_select
    
    @column_name_on_select.setter
    def column_name_on_select(self, value):
        if value:
            self._set_handler([self.select_button,],'selectValue')
        else:
            self._clear_handler([self.select_button,])
        self.__text_on_select = value
    
    def _set_handler(self, components, handler):
        if not isinstance(components, (list, tuple)):
            components = [components]
        for component in components:
            component.handler = handler
            component.disabled = False
            
    def _clear_handler(self, components):
        if not isinstance(components, (list, tuple)):
            components = [components]
        for component in components:
            component.handler = None
            component.disabled = True
            
    def init_grid_components(self):
        if not self.grid:
            grid = ExtGrid(region='center')
            grid.handler_rowcontextmenu = ExtContextMenu()
            grid.handler_contextmenu = ExtContextMenu()
            grid.top_bar = ExtToolBar()
            
            search_grid = ExtSearchField(empty_text = u'Поиск', width=200, component_for_search = grid)
            
            self.grid = grid
            self.search_text_grid = search_grid
            self.items.append(grid)
            
            # Добавляются пункты в меню грида и на тулбар грида 
            self.__components_new_grid      = self._add_menu_item_grid(text=u'Добавить', icon_cls='add_item', disabled=True)
            self.__components_edit_grid     = self._add_menu_item_grid(to_grid_menu = False, text=u'Изменить', icon_cls='edit_item', disabled=True)
            self.__components_delete_grid   = self._add_menu_item_grid(to_grid_menu = False, text=u'Удалить', icon_cls='delete_item', disabled=True)
            self._add_separator_grid()
            self.__components_refresh_grid  = self._add_menu_item_grid(text=u'Обновить', icon_cls='table_refresh', handler='refreshGridStore')
            
            grid.top_bar.add_fill()
            grid.top_bar.items.append(search_grid)
            
    def init_tree_components(self):
        if not self.tree:
            tree = ExtTree(width=180)
            tree.handler_contextmenu = ExtContextMenu()
            tree.handler_containercontextmenu = ExtContextMenu()
            tree.handler_click = 'onClickNode'
            tree.top_bar = ExtToolBar()
            
            search_tree = ExtSearchField(empty_text = u'Поиск', width=200, component_for_search = tree)
            
            self.tree = tree
            self.search_text_tree = search_tree
            self.items.append(tree)
            
            menu=ExtContextMenu()
            self.tree.top_bar.add_menu(icon_cls="add_item", menu=menu, text = u'Добавить')
        
            self.__components_new_tree      = self._add_menu_item_tree(to_tbar = False, to_menu = menu, text=u'Новый в корне', icon_cls='add_item', disabled=True)
            self.__components_new_tree_child= self._add_menu_item_tree(to_tbar = False, to_tree_menu = False, to_menu = menu, text=u'Новый дочерний', icon_cls='add_item', disabled=True)
            self.__components_edit_tree     = self._add_menu_item_tree(to_tree_menu = False, text=u'Изменить', icon_cls='edit_item', disabled=True)
            self.__components_delete_tree   = self._add_menu_item_tree(to_tree_menu = False, text=u'Удалить', icon_cls='delete_item', disabled=True)
            self._add_separator_tree()
            self.__components_refresh_tree  = self._add_menu_item_tree(text=u'Обновить', icon_cls='table_refresh', handler='refreshTreeLoader')
    
    def pre_render(self):
        if self.grid:
            self.grid.action_context = self.action_context
        if self.tree:
            self.tree.action_context = self.action_context
        super(ExtDictionaryWindow, self).pre_render()
    
    def render(self):
        assert (self.grid or self.tree), 'Grid or tree is not initialized'
        if not self.grid and self.tree:
            self.tree.region = 'center'
            self.tree.top_bar.add_fill()
            self.tree.top_bar.items.append(self.search_text_tree)

        elif self.tree:
            self.tree.region = 'west'
            menu = ExtContextMenu(style = dict(overflow='visible')) # overflow='visible' -- для того, чтобы комбобокс отображался
            menu.items.append(self.search_text_tree)
            self.tree.top_bar.add_fill()
            self.tree.top_bar.add_menu(icon_cls="search", menu=menu)
            
        # В режиме выбора даблклик работает на выбор
        if self.mode == self.SELECT_MODE:
            if self.grid:
                self.grid.handler_dblclick = 'selectValue'
            if self.tree:
                self.tree.handler_dblclick = 'selectValue'

        return super(ExtDictionaryWindow, self).render()
    
    @property
    def url_drag_grid(self):
        return self.__url_drag_grid
    
    @url_drag_grid.setter
    def url_drag_grid(self, value):
        assert self.tree, 'Tree is not initialized'
        if value:
            self.grid.drag_drop = True
            self.grid.drag_drop_group = 'TreeDD'
            self.tree.handler_beforedrop = 'onBeforeDrop'
        else:
            self.grid.drag_drop = False
            self.grid.drag_drop_group = None
        self.__url_drag_grid = value
        
    @property
    def url_drag_tree(self):
        return self.__url_drag_tree
    
    @url_drag_tree.setter
    def url_drag_tree(self, value):
        if value:
            self.tree.drag_drop = True
            self.tree.handler_beforedrop = 'onBeforeDrop'
        else:
            self.tree.drag_drop = False
        self.__url_drag_tree = value
