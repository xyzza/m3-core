#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.fields.base import BaseExtField


class ExtContainer(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-container.js'
        self.init_component(*args, **kwargs)
    
    @property
    def items(self):
        return self._items
    
    
class ExtToolbar(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtToolbar, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-toolbar.js'
        self._items = []
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        res = []
        for item in self.items:
            # Если объект нашей структуры классов, то пусть сам рендерится, если нет, отдаем так как есть.
            if isinstance(item, ExtUIComponent):
                res.append(item.render()) 
            else:
                res.append(item)        
        return ','.join(res)
        
    def add_fill(self):
        self.items.append('"->"')
                
    def add_separator(self):
        self.items.append('"-"')
                
    def add_spacer(self, width=2):
        self.items.append("{xtype: 'tbspacer', width: %d}" % width)
                
    def add_text_item(self, text_item):
        self.items.append('"%s"' % text_item)
        
    def add_menu(self, **kwargs):
        self.items.append(ExtToolbarMenu(**kwargs))
          
    @property
    def items(self):
        return self._items
    
    
class ExtPaggingbar(BaseExtContainer):   
    def __init__(self, *args, **kwargs):
        super(ExtPaggingbar, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-paggingbar.js'
        self.page_size = 25
        self.init_component(*args, **kwargs)
        
         
class ExtToolbarMenu(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(ExtToolbarMenu, self).__init__(*args, **kwargs)
        self.text = None
        self.icon_cls = None
        self.tooltip_text = None
        self.menu = None
        self.init_component(*args, **kwargs)
        
    def render(self):
        res = 'id:"%s"' % self.client_id
        if self.text:
            res = 'text: "%s"' % self.text
        if self.icon_cls:
            res += ',iconCls: "%s"' % self.icon_cls
        if self.tooltip_text:
            res += ',tooltip: "%s"' % self.tooltip_text
        if self.menu:
            res += ',menu: %s' % self.menu.render()
            
        return '{%s}' % res
    
    
class ExtButtonGroup(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtButtonGroup, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-button-group.js'
        self.columns_number = None
        self.title = None
        self.init_component(*args, **kwargs)  
    
    def add_button(self, **kwargs):
        self.buttons.append(ExtButton(**kwargs))
    
    def t_render_buttons(self):
        return self.t_render_items()
   
    @property
    def buttons(self):
        return self._items
    
    
# Скорей всего Viewport не понадобится и будет удален!
#class ExtViewport(BaseExtContainer):
#    ''' Реализует работу Viewport компонента extjs'''
#    class ViewportItems(BaseExtContainer):
#        '''Реализует работу вложенных полей контрола viewport, такие как - west, north, center, etc.'''
#        def __init__(self, *args, **kwargs):
#            super(ExtViewport.ViewportItems, self).__init__(*args, **kwargs)
#            self.__items = None
#            self.xtype = None
#            self.init_component(*args, **kwargs)
#            
#        @property
#        def items(self):
#            return self.__items
#    
#    
#    def __init__(self, *args, **kwargs):
#        super(ExtViewport, self).__init__(*args, **kwargs)
#        self.template = 'ext-containers/ext-viewport.js'
#        self.__items = dict(north=None, south=None, east=None, west=None, center=None)
#        self.init_component(*args, **kwargs)
#        
#    def t_render_items(self):
#        return ','.join([item.render() for item in self.__items.values()])
#    
#    def set_north(self, **kwargs):
#        kwargs['region'] = 'north'
#        self.__set_item('north', **kwargs)
#    
#    def set_south(self, **kwargs):
#        kwargs['region'] = 'south'
#        self.__set_item('south', **kwargs)
#    
#    def set_east(self, **kwargs):
#        kwargs['region'] = 'east'
#        self.__set_item('east', **kwargs)
#    
#    def set_west(self, **kwargs):
#        kwargs['region'] = 'west'
#        self.__set_item('west', **kwargs)
#    
#    def set_center(self, **kwargs):
#        kwargs['region'] = 'center'
#        self.__set_item('center', **kwargs)
#    
#    def __set_item(self, type, **kwargs):
#        self.items[type] = ExtViewport.ViewportItems( **kwargs)
#    
#    @property
#    def items(self):
#        return self.__items
#    
#    @property
#    def north(self):
#        return self.__items.get('north')
#    
#    @property
#    def south(self):
#        return self.__items.get('south')
#    
#    @property
#    def east(self):
#        return self.__items.get('east')
#    
#    @property
#    def west(self):
#        return self.__items.get('west')
#    
#    @property
#    def center(self):
#        return self.__items.get('center')