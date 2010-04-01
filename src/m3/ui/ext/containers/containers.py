#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''
from m3.ui.ext.base import ExtUIComponent
from base import BaseExtContainer
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.fields.base import BaseExtField

from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
# ExtUIComponent - в классе контэйнер

class ExtContainer(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-container.js'
        self.__items = TypedList(type = ExtUIComponent)
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        return ','.join([item.render() for item in self.items])
    
    @property
    def items(self):
        return self.__items

class ExtToolbar(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtToolbar, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-toolbar.js'
        self.__items = []
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
          
    @property
    def items(self):
        return self.__items
    
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