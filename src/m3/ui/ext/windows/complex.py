#coding: utf-8

'''
Created on 9.03.10

@author: prefer
'''

from base import BaseExtWindow
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtGrid

from m3.ui.ext.fields import ExtStringField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtContainer,  \
                                ExtButtonGroup, \
                                ExtContextMenu, \
                                ExtPanel,       \
                                ExtListView,    \
                                ExtToolbar,     \
                                ExtTree
        
        
class ExtDictionaryWindow(BaseExtWindow):
    ''' Базовое окно для простого линейного справочника '''
    def __init__(self, *args, **kwargs):
        super(ExtDictionaryWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.template_globals = 'ext-script/ext-dictionary-window-globals.js'
        self.layout='border'
        
        search = ExtStringField(label = u'Поиск')
#        text_cont = ExtContainer(layout='form', style={'padding':'5px'})
#        text_cont.items.append(search)
        
        search_btn = ExtButton(text = u'Найти', handler='search')
        search_clear = ExtButton(text = u'Сбросить', handler='clear_text')
#        top_cont = ExtContainer(region='north',layout='column', min_height=35)
#        top_cont.items.append(text_cont)
#        top_cont.items.append(search_btn)
#        top_cont.items.append(search_clear)
        
        grid = ExtGrid(region='center')
        
        row_menu = ExtContextMenu()
        grid.handler_rowcontextmenu = row_menu
        
        menu = ExtContextMenu()
        grid.handler_contextmenu = menu
        
        
        button_group = ExtButtonGroup(columns_number=1)
        cont_west = ExtContainer(region='west', min_width=30)
        cont_west.items.append(button_group)

        toolbar = ExtToolbar()
        grid.top_bar = toolbar
        #self.items.append(top_cont)
        self.items.append(grid)
        #self.items.append(toolbar)
        #self.items.append(cont_west)
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
        
        
        
        # Основные контролы должны быть доступны для изменения
        self.grid = grid
        self.toolbar = toolbar
        self.grid_row_menu = row_menu
        self.grid_menu = menu
        self.list_view = None
        self.search_text = search
        self.search_button = search_btn
        self.search_clear = search_clear
        self.select_button = None
        self.__panel_list_view = None
        
        # Окно может находится в двух положениях: просто список записей и список выбора записи/записей
        self.__mode = 0 # По умолчанию справочник открыт в режиме списка
     
        # Добавляются пункты в меню и на тулбар
        self.__components_new   = self.__add_menu_item(0, text=u'Новый', icon_cls='add_item', disabled=True)
        self.__components_edit  = self.__add_menu_item(1, text=u'Редактировать', icon_cls='edit_item', disabled=True)
        self.__components_delete= self.__add_menu_item(1, text=u'Удалить', icon_cls='delete_item', disabled=True)
        self.__add_separator(0)
        self.__components_refresh= self.__add_menu_item(0, text=u'Обновить', icon_cls='table_refresh', handler='search')
        
        toolbar.add_fill()
        toolbar.items.append(search)
        toolbar.items.append(search_btn)
        toolbar.items.append(search_clear)
        
        # Вызываемые url
        self.__url_new = None
        self.__url_edit = None
        self.__url_delete = None
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
        
    def __add_menu_item(self, flag, **kwargs):
        '''
        @param flag: Указывает как будет добавляться пункт,
            0 - Добавляется в тублар, в конт. меню строки, в меню всего грида
            1 - Добавляется в тублар, в конт. меню строки
        '''
        text = None
        if kwargs.has_key('text'):
            text = kwargs.pop("text")
            
        self.toolbar.items.append(ExtButton(tooltip_text=text, **kwargs))
        self.grid_row_menu.add_item(text=text, **kwargs)
            
        if flag==0:
            self.grid_menu.add_item(text=text, **kwargs)
            return (self.toolbar.items[len(self.toolbar.items)-1], 
                    self.grid_row_menu.items[len(self.grid_row_menu.items)-1], 
                    self.grid_menu.items[len(self.grid_menu.items)-1])
        else:
            return (self.toolbar.items[len(self.toolbar.items)-1], 
                self.grid_row_menu.items[len(self.grid_row_menu.items)-1])
        
    def __add_separator(self, flag):
        self.grid_row_menu.add_separator()   
        self.toolbar.add_separator()   
        if flag==0:
            self.grid_menu.add_separator()
        
    @property
    def url_new(self):
        return self.__url_new
        
    @url_new.setter
    def  url_new(self, value):
        if value:
            self.__set_handler(self.__components_new, 'new_value')
        else:
            self.__clear_handler(self.__components_new)
        self.__url_new = value
    
    @property
    def url_edit(self):
        return self.__url_edit
    
    @url_edit.setter
    def url_edit(self, value):
        if value:
            self.__set_handler(self.__components_edit,'edit_value')
        else:
            self.__clear_handler(self.__components_edit)
        self.__url_edit = value 
    
    @property
    def url_delete(self):
        return self.__url_delete
    
    @url_delete.setter
    def url_delete(self, value):
        if value:
            self.__set_handler(self.__components_delete, 'delete_value')
        else:
            self.__clear_handler(self.__components_delete)
        self.__url_delete = value 
    
    @property
    def column_name_on_select(self):
        return self.__text_on_select
    
    @column_name_on_select.setter
    def column_name_on_select(self, value):
        if value:
            self.__set_handler([self.select_button,],'select_value')
        else:
            self.__clear_handler([self.select_button,])
        self.__text_on_select = value
    
    def __set_handler(self, components, handler):
        for component in components:
            component.handler = handler
            component.disabled = False
            
    def __clear_handler(self, components):
        for component in components:
            component.handler = None
            component.disabled = True
            
            
class ExtTreeDictionaryWindow(BaseExtWindow):
    ''' Базовое окно для иерархичесого справочника '''
    def __init__(self, *args, **kwargs):
        super(ExtTreeDictionaryWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.template_globals = 'ext-script/ext-tree-dictionary-window-globals.js'
        self.layout='border'
        
        search_grid = ExtStringField(empty_text = u'Поиск', width=200)
        search_btn_grid = ExtButton(text = u'Найти', handler='searchGrid')
        search_clear_grid = ExtButton(text = u'Сбросить', handler='clearSearchGrid')

        grid = ExtGrid(region='center')
        grid.handler_rowcontextmenu = ExtContextMenu()
        grid.handler_contextmenu = ExtContextMenu()
        grid.top_bar = ExtToolbar()
        
        tree = ExtTree(region='west', width=180)
        tree.handler_contextmenu = ExtContextMenu()
        
        tree.handler_containercontextmenu = ExtContextMenu()
        tree.top_bar = ExtToolbar()
        
        self.items.extend([grid, tree])
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))

        # Основные контролы должны быть доступны для изменения
        self.grid = grid
        self.tree = tree
       
        self.list_view = None
        self.search_text_grid = search_grid
        self.search_button = search_btn_grid
        self.search_clear = search_clear_grid
        self.select_button = None
        self.__panel_list_view = None
        
        # Окно может находится в двух положениях: просто список записей и список выбора записи/записей
        self.__mode = 0 # По умолчанию справочник открыт в режиме списка
     
        # Добавляются пункты в меню грида и на тулбар грида 
        self.__components_new_grid  = self.__add_menu_item_grid(0, text=u'Новый', icon_cls='add_item', disabled=True)
        self.__components_edit_grid      = self.__add_menu_item_grid(1, text=u'Редактировать', icon_cls='edit_item', disabled=True)
        self.__components_delete_grid    = self.__add_menu_item_grid(1, text=u'Удалить', icon_cls='delete_item', disabled=True)
        self.__add_separator_grid(0)
        self.__components_refresh_grid   = self.__add_menu_item_grid(0, text=u'Обновить', icon_cls='table_refresh', handler='searchGrid')
        
        grid.top_bar.add_fill()
        grid.top_bar.items.append(search_grid)
        grid.top_bar.items.append(search_btn_grid)
        grid.top_bar.items.append(search_clear_grid)
        
        # Добавляются пункты в меню дерева и на тулбар дерева
        self.__components_new_tree   = self.__add_menu_item_tree(0, text=u'Новый', icon_cls='add_item', disabled=True)
        self.__components_edit_tree  = self.__add_menu_item_tree(1, text=u'Редактировать', icon_cls='edit_item', disabled=True)
        self.__components_delete_tree = self.__add_menu_item_tree(1, text=u'Удалить', icon_cls='delete_item', disabled=True)
        self.__add_separator_tree(0)
        self.__components_refresh_tree = self.__add_menu_item_tree(0, text=u'Обновить', icon_cls='table_refresh', handler='searchTree')
        
#        search_menu = ExtContextMenu()
#        search_tree = ExtStringField(empty_text = u'Поиск')
#        search_menu.items.append(search_tree)
#        tree.top_bar.items.append(search_menu)
        
        # Вызываемые url для грида
        self.__url_new_grid = None
        self.__url_edit_grid = None
        self.__url_delete_grid = None
        self.__column_name_on_select = None
        
        # Вызываемые url для дерева
        self.__url_new_tree = None
        self.__url_edit_tree = None
        self.__url_delete_tree = None
        
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
            
        self.grid.top_bar.items.append(ExtButton(tooltip_text=text, **kwargs))
        self.grid.handler_rowcontextmenu.add_item(text=text, **kwargs)
            
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
            
    def __add_menu_item_tree(self, flag, **kwargs):
        '''
        Добавление контролов управления в дерево
        @param flag: Указывает как будет добавляться пункт,
            0 - Добавляется в тублар, в конт. меню строки, в меню всего грида
            1 - Добавляется в тублар, в конт. меню строки
        '''
        text = None
        if kwargs.has_key('text'):
            text = kwargs.pop("text")
            
        self.tree.top_bar.items.append(ExtButton(tooltip_text=text, **kwargs))
        self.tree.handler_contextmenu.add_item(text=text, **kwargs)
            
        if flag==0:
            self.tree.handler_containercontextmenu.add_item(text=text, **kwargs)
            return (self.tree.top_bar.items[len(self.tree.top_bar.items)-1], 
                    self.tree.handler_contextmenu.items[len(self.tree.handler_contextmenu.items)-1], 
                    self.tree.handler_containercontextmenu.items[len(self.tree.handler_containercontextmenu.items)-1]
                    )
        else:
            return (self.tree.top_bar.items[len(self.tree.top_bar.items)-1], 
                self.tree.handler_contextmenu.items[len(self.tree.handler_contextmenu.items)-1])
        
    def __add_separator_tree(self, flag):
        '''Добавление разделителя в контролы дерево'''
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
        if value:
            self.__set_handler(self.__components_new_grid, 'newValueGrid')
        else:
            self.__clear_handler(self.__components_new_grid)
        self.__url_new_grid = value
    
    @property
    def url_edit_grid(self):
        return self.__url_edit_grid
    
    @url_edit_grid.setter
    def url_edit_grid(self, value):
        if value:
            self.__set_handler(self.__components_edit_grid,'editValueGrid')
        else:
            self.__clear_handler(self.__components_edit_grid)
        self.__url_edit_grid = value 
    
    @property
    def url_delete_grid(self):
        return self.__url_delete_grid
    
    @url_delete_grid.setter
    def url_delete_grid(self, value):
        if value:
            self.__set_handler(self.__components_delete_grid, 'deleteValueGrid')
        else:
            self.__clear_handler(self.__components_delete_grid)
        self.__url_delete_grid = value 
    
    #Урлы для дерева
    @property
    def url_new_tree(self):
        return self.__url_new_tree
        
    @url_new_tree.setter
    def  url_new_tree(self, value):
        if value:
            self.__set_handler(self.__components_new_tree, 'newValueTree')
        else:
            self.__clear_handler(self.__components_new_tree)
        self.__url_new_tree = value
    
    @property
    def url_edit_tree(self):
        return self.__url_edit_tree
    
    @url_edit_tree.setter
    def url_edit_tree(self, value):
        if value:
            self.__set_handler(self.__components_edit_tree,'editValueTree')
        else:
            self.__clear_handler(self.__components_edit_tree)
        self.__url_edit_tree = value 
    
    @property
    def url_delete_tree(self):
        return self.__url_delete_grid
    
    @url_delete_tree.setter
    def url_delete_tree(self, value):
        if value:
            self.__set_handler(self.__components_delete_tree, 'deleteValueTree')
        else:
            self.__clear_handler(self.__components_delete_tree)
        self.__url_delete_tree = value 
    
    @property
    def column_name_on_select(self):
        return self.__text_on_select
    
    @column_name_on_select.setter
    def column_name_on_select(self, value):
        if value:
            self.__set_handler([self.select_button,],'selectValueGrid')
        else:
            self.__clear_handler([self.select_button,])
        self.__text_on_select = value
    
    def __set_handler(self, components, handler):
        for component in components:
            component.handler = handler
            component.disabled = False
            
    def __clear_handler(self, components):
        for component in components:
            component.handler = None
            component.disabled = True