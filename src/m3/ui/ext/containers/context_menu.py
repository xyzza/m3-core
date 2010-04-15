#coding: utf-8
'''
Created on 15.03.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer

# Меню может привязываться к:
from m3.ui.ext.containers import ExtGrid, ExtTree
from m3.ui.ext.misc import ExtConnection


class ExtContextMenu(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContextMenu, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-context-menu.js'
        self._items = []
        self.container = None
        self.init_component(*args, **kwargs)

    def add_item(self, **kwargs):
        self.items.append(ExtContextMenuItem(**kwargs))
        
    def add_separator(self):
        self.items.append('"-"')
    
    def t_render_items(self):
        res = []
        for item in self.items:
            if isinstance(item, ExtContextMenuItem):
                res.append(item.render(self.container))
            else:
                res.append(item)
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
        self.init_component(*args, **kwargs)
        
    def render(self, container):
        res = 'text:"%s"' % self.text
        if self.icon_cls:
            res += ',iconCls: "%s"' % self.icon_cls
        if self.disabled:
            res += ',disabled: true'
        if self.hidden:
            res += ',hidden: true'
        if self.handler:
            if isinstance(self.handler, ExtConnection):
                res += ',handler: function(){%s} ' % self.handler.render() 
            elif isinstance(container, ExtGrid): # Будет работать только с templates-globals!!!
                res += ',handler: function(){return %s(grid)}' % self.handler
            elif isinstance(container, ExtTree):
                res += ',handler: function(){return %s(tree)}' % self.handler
            else:
                res += ',handler: %s' % self.handler
        return '{%s}' % res