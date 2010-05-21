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
                                ExtToolbar, 
                                ExtTree,
                                ExtGrid)
        
                
class ExtDictionaryWindow(BaseExtWindow):
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
        self.init_component(*args, **kwargs)
        
    @property
    def mode(self):
        return self.__mode
    
    @mode.setter
    def mode(self, value):
        assert value in (0,1), 'Mode only 1 (select mode) or 0 (list mode)'

        if value==1:
            buttom_panel = ExtPanel(title='История выбора',
                                region='south',min_height=100, collapsible=True, split=True)
            list_view = ExtListView() 
            buttom_panel.items.append(list_view)
            self.items.append(buttom_panel)
        
            select_btn = ExtButton(text = u'Выбрать', disabled=True)
            self.buttons.insert(0, select_btn)
            
            self.select_button = select_btn
            self.__panel_list_view = buttom_panel
            self.list_view = list_view
        elif value==0:
            if self.__panel_list_view:
                self.items.remove(self.__panel_list_view)
                self.list_view = None
                self.__panel_list_view = None
            if self.select_button:
                self.buttons.remove(self.select_button)
                self.select_button = None

        self.__mode = value
        
    def __add_menu_item_grid(self, flag, **kwargs):
        '''
        Добавление контролов управления в грид
        @param flag: Указывает как будет добавляться пункт,
            0 - Добавляется в тублар, в конт. меню строки, в меню всего грида
            1 - Добавляется в тублар, в конт. меню строки
        '''

        text = None
        if kwargs.has_key('text'):
            text = kwargs.pop("text")
            
        self.grid.handler_rowcontextmenu.add_item(text=text, **kwargs)
        self.grid.top_bar.items.append(ExtButton(tooltip_text=text, **kwargs))
            
        if flag==0:
            self.grid.handler_contextmenu.add_item(text=text, **kwargs)
            return (self.grid.top_bar.items[len(self.grid.top_bar.items)-1], 
                    self.grid.handler_rowcontextmenu.items[len(self.grid.handler_rowcontextmenu.items)-1], 
                    self.grid.handler_contextmenu.items[len(self.grid.handler_contextmenu.items)-1])
        else:
            return (self.grid.top_bar.items[len(self.grid.top_bar.items)-1], 
                self.grid.handler_rowcontextmenu.items[len(self.grid.handler_rowcontextmenu.items)-1])
        
    def __add_separator_grid(self, flag):
        '''Добавление разделителя в контролы грида'''
        self.grid.handler_rowcontextmenu.add_separator()
        self.grid.top_bar.add_separator()
        if flag==0:
            self.grid.handler_contextmenu.add_separator()
            
    def __add_menu_item_tree(self, flag, menu=None, **kwargs):
        '''
        Добавление контролов управления в дерево
        @param flag: Указывает как будет добавляться пункт,
            0 - Добавляется в тублар, в конт. меню строки, в меню всего грида
            1 - Добавляется в тублар, в конт. меню строки
        '''
        text = None
        if kwargs.has_key('text'):
            text = kwargs.pop("text")
            
        return_item = None
        if menu:
            menu.add_item(text=text,**kwargs)
            return_top_bar_item = menu.items[len(menu.items)-1]
        else:
            self.tree.top_bar.items.append(ExtButton(tooltip_text=text, **kwargs))
            return_top_bar_item = self.tree.top_bar.items[len(self.tree.top_bar.items)-1]
        
        self.tree.handler_contextmenu.add_item(text=text, **kwargs)
            
        if flag==0:
            self.tree.handler_containercontextmenu.add_item(text=text, **kwargs)
            return (return_top_bar_item, 
                    self.tree.handler_contextmenu.items[len(self.tree.handler_contextmenu.items)-1], 
                    self.tree.handler_containercontextmenu.items[len(self.tree.handler_containercontextmenu.items)-1]
                    )
        else:
            return (return_top_bar_item, 
                self.tree.handler_contextmenu.items[len(self.tree.handler_contextmenu.items)-1])
        
    def __add_separator_tree(self, flag):
        '''Добавление разделителя в контролы дерева'''
        self.tree.handler_contextmenu.add_separator()   
        self.tree.top_bar.add_separator()
        if flag==0:
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
            self._set_handler(self.__components_edit_grid,'editValueGrid')
        else:
            self._clear_handler(self.__components_edit_grid)
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
            self._set_handler(self.__components_edit_tree,'editValueTree')
        else:
            self._clear_handler(self.__components_edit_tree)
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
            grid.top_bar = ExtToolbar()
            
            search_grid = ExtSearchField(empty_text = u'Поиск', width=200, component_for_search = grid)
            
            self.grid = grid
            self.search_text_grid = search_grid
            self.items.append(grid)
            
            # Добавляются пункты в меню грида и на тулбар грида 
            self.__components_new_grid  = self.__add_menu_item_grid(0, text=u'Новый', icon_cls='add_item', disabled=True)
            self.__components_edit_grid      = self.__add_menu_item_grid(1, text=u'Редактировать', icon_cls='edit_item', disabled=True)
            self.__components_delete_grid    = self.__add_menu_item_grid(1, text=u'Удалить', icon_cls='delete_item', disabled=True)
            self.__add_separator_grid(0)
            self.__components_refresh_grid   = self.__add_menu_item_grid(0, text=u'Обновить', icon_cls='table_refresh', handler='refreshGridStore')
            
            grid.top_bar.add_fill()
            grid.top_bar.items.append(search_grid)
            
    def init_tree_components(self):
        if not self.tree:
            tree = ExtTree(width=180)
            tree.handler_contextmenu = ExtContextMenu()
            tree.handler_containercontextmenu = ExtContextMenu()
            tree.handler_click = 'onClickNode'
            tree.top_bar = ExtToolbar()
            
            search_tree = ExtSearchField(empty_text = u'Поиск', width=200, component_for_search = tree)
            
            self.tree = tree
            self.search_text_tree = search_tree
            self.items.append(tree)
            
            menu=ExtContextMenu()
            self.tree.top_bar.add_menu(icon_cls="add_item", menu=menu, tooltip_text = u'Добавить')
        
            self.__components_new_tree      = self.__add_menu_item_tree(0, menu,  text=u'Новый в корне', icon_cls='add_item', disabled=True)
            self.__components_new_tree_child= self.__add_menu_item_tree(1, menu,  text=u'Новый дочерний', icon_cls='add_item', disabled=True)
            self.__components_edit_tree     = self.__add_menu_item_tree(1, text=u'Редактировать', icon_cls='edit_item', disabled=True)
            self.__components_delete_tree   = self.__add_menu_item_tree(1, text=u'Удалить', icon_cls='delete_item', disabled=True)
            self.__add_separator_tree(0)
            self.__components_refresh_tree  = self.__add_menu_item_tree(0, text=u'Обновить', icon_cls='table_refresh', handler='refreshTreeLoader')
            
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