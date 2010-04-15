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
        text_cont = ExtContainer(layout='form', style={'padding':'5px'})
        text_cont.items.append(search)
        
        search_btn = ExtButton(text = u'Найти', style={'padding':'5px'}, handler='search', width=80)
        search_clear = ExtButton(text = u'Сбросить', style={'padding':'5px'}, handler='clear_text', width=80)
        top_cont = ExtContainer(region='north',layout='column', min_height=35)
        top_cont.items.append(text_cont)
        top_cont.items.append(search_btn)
        top_cont.items.append(search_clear)
        
        grid = ExtGrid(region='center')
        
        row_menu = ExtContextMenu()
        grid.handler_rowcontextmenu = row_menu
        
        menu = ExtContextMenu()
        grid.handler_contextmenu = menu
        
        
        button_group = ExtButtonGroup(columns_number=1)
        cont_west = ExtContainer(region='west', min_width=30)
        cont_west.items.append(button_group)

        self.items.append(top_cont)
        self.items.append(grid)
        self.items.append(cont_west)
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
        
        # Основные контролы должны быть доступны для изменения
        self.grid = grid
        self.button_group = button_group
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
            
        self.button_group.add_button(tooltip_text=text, **kwargs)
        self.grid_row_menu.add_item(text=text, **kwargs)
            
        if flag==0:
            self.grid_menu.add_item(text=text, **kwargs)
            return (self.button_group.buttons[len(self.button_group.buttons)-1], 
                    self.grid_row_menu.items[len(self.grid_row_menu.items)-1], 
                    self.grid_menu.items[len(self.grid_menu.items)-1])
        else:
            return (self.button_group.buttons[len(self.button_group.buttons)-1], 
                self.grid_row_menu.items[len(self.grid_row_menu.items)-1])
        
    def __add_separator(self, flag):
        self.grid_row_menu.add_separator()   
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
        
        search = ExtStringField(empty_text = u'Поиск', width=200)
        search_btn = ExtButton(text = u'Найти', handler='search')
        search_clear = ExtButton(text = u'Сбросить', handler='clear_text')

        grid = ExtGrid(region='center')
        
        row_menu = ExtContextMenu()
        grid.handler_rowcontextmenu = row_menu
        
        menu = ExtContextMenu()
        grid.handler_contextmenu = menu
        
        
        tree = ExtTree(url='/ui/base-tree-data',region='west', width=150)

        self.items.append(grid)
        self.items.append(tree)
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
        
        toolbar = ExtToolbar()
        
        # Основные контролы должны быть доступны для изменения
        self.grid = grid
        self.top_bar = toolbar
        self.grid_row_menu = row_menu
        self.grid_menu = menu
        self.list_view = None
        self.search_text = search
        self.search_button = search_btn
        self.search_clear = search_clear
        self.select_button = None
        self.__panel_list_view = None
        
        self.tree = tree
        
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
            
        self.top_bar.items.append(ExtButton(tooltip_text=text, **kwargs))
        self.grid_row_menu.add_item(text=text, **kwargs)
            
        if flag==0:
            self.grid_menu.add_item(text=text, **kwargs)
            return (self.top_bar.items[len(self.top_bar.items)-1], 
                    self.grid_row_menu.items[len(self.grid_row_menu.items)-1], 
                    self.grid_menu.items[len(self.grid_menu.items)-1])
        else:
            return (self.top_bar.items[len(self.top_bar.items)-1], 
                self.grid_row_menu.items[len(self.grid_row_menu.items)-1])
        
    def __add_separator(self, flag):
        self.grid_row_menu.add_separator()   
        self.top_bar.add_separator()
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