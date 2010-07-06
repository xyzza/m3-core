#coding: utf-8
'''
Модуль с преднастроенными панелями-деевьями

Created on 25.06.2010

@author: prefer
'''

from m3.ui.ext.containers import ExtTree, ExtGridColumn, ExtGridDateColumn, ExtGridNumberColumn
from m3.ui.ext.containers.grids import ExtGridCheckBoxSelModel
from m3.ui.ext import containers
from m3.ui.ext import controls
from m3.ui.ext import menus
from m3.ui.ext import misc


class ExtObjectTree(ExtTree):
    '''
    Панель с деревом для управления списком объектов.
    '''
    #===========================================================================
    # Внутренние классы для ExtObjectTree
    #===========================================================================
    class TreeContextMenu(menus.ExtContextMenu):
        '''
        Внутренний класс для удобной работы с контекстным меню дерева
        '''
        def __init__(self, *args, **kwargs):
            super(ExtObjectTree.TreeContextMenu, self).__init__(*args, **kwargs)
            self.menuitem_new = menus.ExtContextMenuItem(text = u'Добавить', icon_cls = 'add_item', handler='contextMenuNew')
            self.menuitem_edit = menus.ExtContextMenuItem(text = u'Изменить', icon_cls = 'edit_item', handler='contextMenuEdit')
            self.menuitem_delete = menus.ExtContextMenuItem(text = u'Удалить', icon_cls = 'delete_item', handler='contextMenuDelete')
            self.menuitem_separator = menus.ExtContextMenuSeparator()            
            
            # self.items.extend([self.menuitem_add, self.menuitem_edit, self.menuitem_delete, self.menuitem_separator])
            self.init_component()
    
    class TreeTopBar(containers.ExtToolBar):
        '''
        Внутренний класс для удобной работы топбаром грида
        '''
        def __init__(self, *args, **kwargs):
            super(ExtObjectTree.TreeTopBar, self).__init__(*args, **kwargs)
            self.button_new = controls.ExtButton(text = u'Добавить', icon_cls = 'add_item', handler='topBarNew')
            self.button_edit = controls.ExtButton(text = u'Изменить', icon_cls = 'edit_item', handler='topBarEdit')
            self.button_delete = controls.ExtButton(text = u'Удалить', icon_cls = 'delete_item', handler='topBarDelete')
            self.button_refresh = controls.ExtButton(text = u'Обновить', icon_cls = 'refresh-icon-16', handler='topBarRefresh')
            self.init_component()
            
    #===========================================================================
    # Собственно определение класса ExtObjectTree
    #===========================================================================
    
    def __init__(self, *args, **kwargs):
        super(ExtObjectTree, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-advanced-tree.js'
        #===============================================================================
        # Действия, выполняемые изнутри грида 
        #===============================================================================
        self.action_new = None
        self.action_edit = None
        self.action_delete = None
        self.action_data = None
        
        #=======================================================================
        # Источник данных для грида
        #=======================================================================
        #self.store = misc.ExtJsonStore(auto_load=True, root='rows', id_property='id')
        self.load_mask = True
        self.row_id_name = 'row_id'
        #self.allow_paging = True

        #=======================================================================
        # Контекстное меню и бары грида
        #=======================================================================
        self.context_menu_row = ExtObjectTree.TreeContextMenu()
        self.context_menu_tree = ExtObjectTree.TreeContextMenu()
        self.top_bar = ExtObjectTree.TreeTopBar()
        #self.paging_bar = containers.ExtPagingBar()
        
        self.dblclick_handler = 'onEditRecord'
        
        self.init_component()
        
    def render(self):
        '''
        Переопределяем рендер дерева для того, чтобы модифицировать содержимое его 
        панелей и контекстных меню
        '''
        if self.action_new:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_new)
            self.context_menu_tree.items.append(self.context_menu_tree.menuitem_new)
            
        if self.action_edit:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_edit)
            self.handler_dblclick = self.dblclick_handler
            
        if self.action_delete:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_delete)
                    
        # контекстное меню прицепляется к гриду только в том случае, если 
        # в нем есть хотя бы один пункт
        if self.context_menu_tree.items:
            self.handler_contextmenu = self.context_menu_tree
        if self.context_menu_row.items:
            self.handler_rowcontextmenu = self.context_menu_row
        
        #=======================================================================
        # Настройка top bar
        #=======================================================================
        if self.action_new:
            self.top_bar.items.insert(0, self.top_bar.button_new) 
        
        if self.action_edit:
            self.top_bar.items.append(self.top_bar.button_edit)
        
        if self.action_delete:
            self.top_bar.items.append(self.top_bar.button_delete)
        
        if self.action_data:
            self.top_bar.items.append(self.top_bar.button_refresh)
        
        # тонкая настройка self.store
        if not self.url and self.action_data:
            self.url = self.action_data.absolute_url()
        
#        if self.allow_paging:
#            self.store.start = 0
#            self.store.limit = 25
#            self.bottom_bar = self.paging_bar
        
        return super(ExtObjectTree, self).render()

