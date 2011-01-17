#coding: utf-8
'''
Created on 15.03.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer

# Меню может привязываться к:
#from m3.ui.ext.containers import ExtGrid, ExtTree
from m3.ui.ext.misc import ExtConnection

#===============================================================================
class ExtContextMenu(BaseExtContainer):
    '''
    Контекстное меню 
    
    @version: 0.1
    @begin_designer
    {title: "Menu"
    ,ext_class: "Ext.menu.Menu"
    ,xtype: "menu"
    ,attr: [{
        ext_attr: "items"
        ,py_attr: "items" 
    },{
        ext_attr: "displayMsg"
        ,py_attr: "display_message"
        ,default_value: "Показано записей {0} - {1} из {2}"
    },{
        ext_attr: "empty_message"
        ,py_attr: "emptyText"
        ,default_value: "Нет записей"
    }]}
    @end_designer
    '''
    __SEPARATOR = '"-"'
    def __init__(self, *args, **kwargs):
        super(ExtContextMenu, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-context-menu.js'
        self._items = []
        self.container = None
        self.init_component(*args, **kwargs)

    def add_item(self, **kwargs):
        self.items.append(ExtContextMenuItem(**kwargs))
        
    def add_separator(self):
        self.items.append(ExtContextMenuSeparator())
    
    def t_render_items(self):
        res = []
        for item in self.items:
            if item == ExtContextMenu.__SEPARATOR:
                res.append(item)
            elif self.container:
                res.append(item.render(container=self.container))
            else:
                res.append(item.render())
        return '[%s]' % ','.join(res)
    
    @property
    def items(self):
        return self._items
   
    #---------------------------------------------------------------------------
    # Врапперы над событиями listeners[...]
    @property
    def handler_beforeshow(self):
        return self._listeners.get('beforeshow')
    
    @handler_beforeshow.setter
    def handler_beforeshow(self, value):
        self._listeners['beforeshow'] = value
        
#===============================================================================        
class ExtContextMenuItem(ExtUIComponent):
    '''
    Элементы контекстного меню 
    
    '''
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuItem, self).__init__(*args, **kwargs)
        self.text = None
        self.item_id = None
        self.handler = None
        self.icon_cls = None
        self.menu = None
        self.custom_handler = False
        self.init_component(*args, **kwargs)
        
    def render(self, container=None):
        res = ['text:"%s"' % self.text.replace('"', "&quot;")]
        if self.icon_cls:
            res.append('iconCls: "%s"' % self.icon_cls)
        if self.disabled:
            res.append('disabled: true')
        if self.hidden:
            res.append('hidden: true')
        if self.item_id:
            res.append('itemId: '+ self.item_id)    
        if self.menu:
            res.append('menu: '+ self.menu.render())
        if self.handler:
            if self.custom_handler:
                res.append('handler: %s' % self.handler)
            else:
                if isinstance(self.handler, ExtConnection):
                    res.append('handler: function(){%s} ' % self.handler.render()) 
                else:
                    res.append('handler: %s' % self.handler)
        return '{%s}' % ','.join(res)
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.disabled = access_off

#===============================================================================    
class ExtContextMenuSeparator(ExtUIComponent):
    '''
    Разделитель элементов в меню
    '''
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuSeparator, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
    
    def render(self, *args, **kwargs):
        return '"-"'
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Заглшука.
        pass