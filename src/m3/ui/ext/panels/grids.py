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
            
            self.items.extend([
                self.button_new,
                self.button_edit,
                self.button_delete,
                self.button_refresh,
            ])

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
        
        # Экшен для новой записи
        self.action_new = None
        
        # Экшен для  изменения
        self.action_edit = None
        
        # Экшен для удаления
        self.action_delete = None
        
        # Экшен для данных
        self.action_data = None
        
        # Адрес для новой записи. Адреса имеют приоритет над экшенами!
        self.url_new = None
        
        # Адрес для изменения
        self.url_edit = None
        
        # Адрес для удаления
        self.url_delete = None
        
        # Адрес для данных
        self.url_data = None
        
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
        if self.action_new or self.url_new:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_new)
            self.context_menu_grid.items.append(self.context_menu_grid.menuitem_new)
            
        if self.action_edit or self.url_edit:
            self.context_menu_row.items.append(self.context_menu_row.menuitem_edit)
            self.handler_dblclick = self.dblclick_handler
            
        if self.action_delete or self.url_delete:
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
        if (not self.action_data and not self.url_data and
                self.top_bar.button_refresh in self.top_bar.items):
            self.top_bar.items.remove(self.top_bar.button_refresh)
        
        if (not self.action_delete and not self.url_delete and
                self.top_bar.button_delete in self.top_bar.items):
            self.top_bar.items.remove(self.top_bar.button_delete)
        
        if (not self.action_edit and not self.url_edit and
                self.top_bar.button_edit in self.top_bar.items):
            self.top_bar.items.remove(self.top_bar.button_edit)
        
        if (not self.action_new and not self.url_new and
                self.top_bar.button_new in self.top_bar.items):
            self.top_bar.items.remove(self.top_bar.button_new) 
        
        # тонкая настройка self.store
        if not self.store.url and self.action_data:
            self.store.url = self.action_data.absolute_url()
            
        if self.url_data:
            self.store.url = self.url_data
                            
        assert self.store.url, 'Url for store or action_data is not define'        
        
        if self.allow_paging:
            self.store.start = 0
            self.store.limit = 25
            self.bottom_bar = self.paging_bar
                
        self.render_base_config()
        self.render_params()
        return render_component(self)


    def render_params(self):
        super(ExtObjectGrid, self).render_params()
        
        # Получение адресов для грида. Текстовые адреса более приоритетны чем экшены!
        if not self.url_new and self.action_new:
            self.url_new = self.action_new.absolute_url()
             
        if not self.url_edit and self.action_edit:
            self.url_edit = self.action_edit.absolute_url()
            
        if not self.url_delete and self.action_delete:
            self.url_delete = self.action_delete.absolute_url()
            
        if not self.url_data and self.action_data:
            self.url_data = self.action_data.absolute_url()

        context_json = self.action_context.json if self.action_context else None
        
        self._put_params_value('actions', {'newUrl': self.url_new,
                                            'editUrl': self.url_edit,
                                            'deleteUrl': self.url_delete,
                                            'dataUrl': self.url_data,
                                            'contextJson': context_json})
        
        self._put_params_value('rowIdName', self.row_id_name)
        self._put_params_value('columnParamName', self.column_param_name)
        self._put_params_value('allowPaging', self.allow_paging)
        
    def t_render_base_config(self):
        return self._get_config_str()
    
    def t_render_params(self):
        return self._get_params_str()

class ExtMultiGroupinGrid(containers.ExtGrid):
    def __init__(self, *args, **kwargs):
        super(ExtMultiGroupinGrid, self).__init__(*args, **kwargs)
        self.template = 'ext-grids/ext-multigrouping-grid.js'
        # Для данных
        self.action_data = None
        # Стор для загрузки данных
        self.store = misc.store.ExtMultiGroupingStore(auto_load=True, root='rows', id_property='id')
        # Признак того, маскировать ли грид при загрузки
        self.load_mask = True
        # Поле в котором будет содержаться значение ключа группировки
        # должно отличаться от ключевого поля Store, т.к. должно содержать совсем другие данные 
        self.data_id_field = 'id'
        self.init_component()

    def render(self):
        # тонкая настройка self.store
        if not self.store.url and self.action_data:
            self.store.url = self.action_data.absolute_url()
            
        self.render_base_config()
        self.render_params()
        return render_component(self)

    def render_params(self):
        super(ExtMultiGroupinGrid, self).render_params()
        data_url = self.action_data.absolute_url() if self.action_data else None
        context_json = self.action_context.json if self.action_context else None
        
        self._put_params_value('actions', {'dataUrl': data_url,
                                            'contextJson': context_json})
        
    def t_render_base_config(self):
        self._put_config_value('dataIdField', self.data_id_field)
        return self._get_config_str()
    
    def t_render_params(self):
        return self._get_params_str()