#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.renderers import ExtWindowRenderer
from m3.ui.ext import render_template

from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from m3.ui.ext.controls import ExtButton


class BaseExtWindow(ExtUIComponent):
    '''
    Базовый класс для всех окон в системе
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.template_globals = ''
        self.renderer = ExtWindowRenderer()
        self.renderer.window = self
        
        # параметры окна
        self.width = 400
        self.height = 300
        self.title = None
        self.__items = TypedList(type=ExtUIComponent)
        self.__buttons = TypedList(type=ExtButton)
        
        self.layout = None
        self.modal = self.maximized = self.minimized = False
        self.closable = self.maximizable = self.minimizable = None
        self.body_style = 'padding:5px;'
        self.icon_cls = None
        self.top_bar = None
        self.buttom_bar = None
        self.footer_bar = None
        self.resizable = True
        
    @property
    def buttons(self):
        return self.__buttons
    
    @property
    def items(self):
        return self.__items
        
    def t_render_items(self):
        return ','.join([item.render() for item in self.items])    
        
    def t_render_buttons(self):
        return 'buttons:[%s]' % ','.join([button.render() for button in self.buttons])
    
    def t_render_top_bar(self):
        return self.top_bar.render()
    
    def t_render_buttom_bar(self):
        return self.buttom_bar.render()
    
    def t_render_footer_bar(self):
        return self.footer_bar.render()
    
    def pre_render(self):
        super(BaseExtWindow, self).pre_render()
        children = [] 
        children.extend(self.items)
        children.extend(self.buttons)
        children.append(self.top_bar)
        children.append(self.footer_bar)
        for child in children:
            if child:
                child.action_context = self.action_context
    
    def render_globals(self):
        if self.template_globals:
            return render_template(self.template_globals, {'component': self, 'window': self})
        return ''
    
    def find_by_name(self, name):
        '''Осуществляет поиск экземпляра во вложенных объектах по имени экземпляра'''
        for item in self._items:   
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item
                
            if hasattr(item, '_items'):
                res = item.find_by_name(name)
                if res:
                    return res
    
    # A prefer 9.04.10
    # Следующие магические методы, которые вызываются из шаблона, нужны для:
    # Кнопки по-умолчанию в эксте: (maximizable=False, minimizable=False, closable=True)
    # Т.к. в различных проектах могут быть определена начальная конфигурация, например, для всех окон определены maximizable=True, minimizable=True
    # то возникает проблема: как в некоторых окнах принудительно убрать эти кнопки, при  этом не менять код m3
    # Соответсвенно булевые типы возвращать нельзя, возвращаем строки и в шаблоне проверяем строки с значение None.
    # По-умолчанию у таких атрибутов значение None.
    # ps: Надеемся, что этот прицедент последний
    def t_get_maximizable(self):
        return str(self.maximizable)
    
    def t_get_minimizable(self):
        return str(self.minimizable)
    
    def t_get_closable(self):
        return str(self.closable)
    