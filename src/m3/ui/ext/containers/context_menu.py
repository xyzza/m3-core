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


class ExtContextMenu(BaseExtContainer):
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
        return ','.join(res)
    
    @property
    def items(self):
        return self._items
   
    #----------------------------------------------------------------------------
    # Врапперы над событиями listeners[...]
    @property
    def handler_beforeshow(self):
        return self._listeners.get('beforeshow')
    
    @handler_beforeshow.setter
    def handler_beforeshow(self, value):
        self._listeners['beforeshow'] = value
        
        
class ExtContextMenuItem(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuItem, self).__init__(*args, **kwargs)
        self.text = None
        self.handler = None
        self.icon_cls = None
        self.menu = None
        self.custom_handler = False
        self.init_component(*args, **kwargs)
        
    def render(self, container=None):
        res = 'text:"%s"' % self.text
        if self.icon_cls:
            res += ',iconCls: "%s"' % self.icon_cls
        if self.disabled:
            res += ',disabled: true'
        if self.hidden:
            res += ',hidden: true'
        if self.menu:
            res += ',menu: '+ self.menu.render()
        if self.handler:
            if self.custom_handler:
                res += ',handler: %s' % self.handler
            else:
                if isinstance(self.handler, ExtConnection):
                    res += ',handler: function(){%s} ' % self.handler.render() 
#                elif isinstance(container, ExtGrid): # Будет работать только с templates-globals!!!
#                    res += ',handler: function(){return %s(grid)}' % self.handler
#                elif isinstance(container, ExtTree):
#                    res += ',handler: function(){return %s(tree)}' % self.handler
                else:
                    res += ',handler: %s' % self.handler
        return '{%s}' % res
    
class ExtContextMenuSeparator(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(ExtContextMenuSeparator, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
    
    def render(self, *args, **kwargs):
        return '"-"'