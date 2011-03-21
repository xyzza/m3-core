#coding: utf-8
'''
Модуль с преднастроенными панелями-гридами

Created on 26.05.2010

@author: akvarats
'''

from m3.ui.ext import containers, controls, menus, misc, render_component

class ExtObjectGrid(containers.ExtGrid):
    '''
    Панель с гридом для управления списком объектов.
    '''
    #===========================================================================
    # Внутренние классы для ExtObjectGrid
    #===========================================================================
    class GridContextMenu(menus.ExtContextMenu):
        '''
        Внутренний класс для удобной работы с контекстным меню грида
        '''
        def __init__(self, *args, **kwargs):
            super(ExtObjectGrid.GridContextMenu, self).__init__(*args, **kwargs)
            self.menuitem_new = menus.ExtContextMenuItem(text = u'Добавить', 
                                icon_cls = 'add_item', handler='contextMenuNew')
            self.menuitem_edit = menus.ExtContextMenuItem(text = u'Изменить', 
                                icon_cls = 'edit_item', handler='contextMenuEdit')
            self.menuitem_delete = menus.ExtContextMenuItem(text = u'Удалить', 
                                icon_cls = 'delete_item', handler='contextMenuDelete')
            self.menuitem_separator = menus.ExtContextMenuSeparator()            
                        
            self.init_component()
    
    class GridTopBar(containers.ExtToolBar):
        '''
        Внутренний класс для удобной работы топбаром грида
        '''
        def __init__(self, *args, **kwargs):
            super(ExtObjectGrid.GridTopBar, self).__init__(*args, **kwargs)
            self.button_new = controls.ExtButton(text = u'Добавить', 
                                    icon_cls = 'add_item', handler='topBarNew')
            self.button_edit = controls.ExtButton(text = u'Изменить', 
                                    icon_cls = 'edit_item', handler='topBarEdit')
            self.button_delete = controls.ExtButton(text = u'Удалить', 
                                    icon_cls = 'delete_item', handler='topBarDelete')
            self.button_refresh = controls.ExtButton(text = u'Обновить', 
                                    icon_cls = 'refresh-icon-16', handler='topBarRefresh')
            self.init_component()
            
    #===========================================================================
    # Собственно определение класса ExtObjectGrid
    #===========================================================================
    
    def __init__(self, *args, **kwargs):
        super(ExtObjectGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-object-grid.js'
        
        #=======================================================================
        # Действия, выполняемые изнутри грида 
        #=======================================================================
        
        # Для новой записи
        self.action_new = None
        
        # Для изменения
        self.action_edit = None
        
        # Для удаления
        self.action_delete = None
        
        # Для данных
        self.action_data = None
        
        #=======================================================================
        # Источник данных для грида
        #=======================================================================
        
        # Стор для загрузки данных
        self.store = misc.ExtJsonStore(auto_load=True, root='rows', id_property='id')
        
        # Признак того, маскировать ли грид при загрузки
        self.load_mask = True
        
        # Поля для id записи
        self.row_id_name = 'row_id'
        
        # имя параметра, через который передается имя выделенной колонки
        self.column_param_name = 'column' 
        
        # Использовать постраничную навигацию
        self.allow_paging = True

        #=======================================================================
        # Контекстное меню и бары грида
        #=======================================================================
        
        # Контекстное меню для строки грида
        self.context_menu_row = ExtObjectGrid.GridContextMenu()
        
        # Контекстное меню для грида, если произошел счелчок не на строке
        self.context_menu_grid = ExtObjectGrid.GridContextMenu()
        
        # Топ бар для грида
        self.top_bar = ExtObjectGrid.GridTopBar()
        
        # Paging бар для постраничной навигации
        self.paging_bar = containers.ExtPagingBar()
        
        # Обработчик двойного клика
        self.dblclick_handler = 'onEditRecord'
        
        self.init_component()


    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.top_bar.button_new.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.top_bar.button_edit.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.top_bar.button_delete.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_grid.menuitem_new.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_grid.menuitem_edit.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_grid.menuitem_delete.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_row.menuitem_new.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_row.menuitem_edit.make_read_only(access_off, exclude_list, *args, **kwargs)
        self.context_menu_row.menuitem_delete.make_read_only(access_off, exclude_list, *args, **kwargs)
        
        
    @property
    def handler_beforenew(self):
        return self._listeners.get('beforenewrequest')
    
    @handler_beforenew.setter
    def handler_beforenew(self, function):
        self._listeners['beforenewrequest'] = function    
        
    def render(self):
        '''
        Переопределяем рендер грида для того, чтобы модифицировать содержимое его 
        панелей и контекстных меню
        '''
        if self.action_new:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_new)
            self.context_menu_grid.items.append(self.context_menu_grid.menuitem_new)
            
        if self.action_edit:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_edit)
            self.handler_dblclick = self.dblclick_handler
            
        if self.action_delete:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_delete)
                    
        # контекстное меню прицепляется к гриду только в том случае, если 
        # в нем есть хотя бы один пункт
        if self.context_menu_grid.items:
            self.handler_contextmenu = self.context_menu_grid
        if self.context_menu_row.items:
            self.handler_rowcontextmenu = self.context_menu_row
        
        #=======================================================================
        # Настройка top bar
        #=======================================================================
        # @TODO: Отрефакторить данный метод, чтобы он был не в рендеринге 
        if self.action_data:
            self.top_bar.items.insert(0, self.top_bar.button_refresh)
        
        if self.action_delete:
            self.top_bar.items.insert(0, self.top_bar.button_delete)
        
        if self.action_edit:
            self.top_bar.items.insert(0, self.top_bar.button_edit)
        
        if self.action_new:
            self.top_bar.items.insert(0, self.top_bar.button_new) 
        
        # тонкая настройка self.store
        if not self.store.url and self.action_data:
            self.store.url = self.action_data.absolute_url()
        
        if self.allow_paging:
            self.store.start = 0
            self.store.limit = 25
            self.bottom_bar = self.paging_bar
        
        
        self.render_base_config()
        self.render_params()
        return render_component(self)


    def render_params(self):
        super(ExtObjectGrid, self).render_params()
        
        new_url = self.action_new.absolute_url() if self.action_new else None
        edit_url = self.action_edit.absolute_url() if self.action_edit else None
        delete_url = self.action_delete.absolute_url() if self.action_delete else None
        data_url = self.action_data.absolute_url() if self.action_data else None
        context_json = self.action_context.json if self.action_context else None
        
        self._put_params_value('actions', {'newUrl': new_url,
                                            'editUrl': edit_url,
                                            'deleteUrl': delete_url,
                                            'dataUrl': data_url,
                                            'contextJson': context_json})
        
        self._put_params_value('rowIdName', self.row_id_name)
        self._put_params_value('columnParamName', self.column_param_name)
        self._put_params_value('allowPaging', self.allow_paging)
        
    def t_render_base_config(self):
        return self._get_config_str()
    
    def t_render_params(self):
        return self._get_params_str()
