#coding: utf-8
'''
Created on 15.03.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer
from m3.ui.ext import render_component
from m3.ui.ext.containers import ExtGrid, ExtTree

class ExtContextMenu(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContextMenu, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-contextmenu.js'
        self.__items = []
        self.container = None
        self.init_component(*args, **kwargs)

    def add_item(self, **kwargs):
        self.__items.append(ExtContextMenuItem(**kwargs))
        
    def add_spacer(self):
        self.__items.append('"-"')
        
    def render(self):
        return render_component(self)
    
    def t_render_items(self):
        res = []
        for item in self.__items:
            if isinstance(item, ExtContextMenuItem):
                res.append(item.render(self.container))
            else:
                res.append(item)
        return ','.join(res)
        
    def t_get_listeners(self):
       ''' Инкапсуляция над _listeners. Используется из шаблонов! '''
       return self._listeners
   
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
        self.text = ''
        self.handler = ''
        self.init_component(*args, **kwargs)
        
    def render(self, container):
        res = 'text:"%s"' % self.text
        if self.handler:
            if isinstance(container, ExtGrid):
                res += ',handler: function(){return %s(grid)}' % self.handler
            elif isinstance(container, ExtTree):
                res += ',handler: function(){return %s(tree)}' % self.handler
            else:
                res += ',handler: %s' % self.handler
        return '{%s}' % res