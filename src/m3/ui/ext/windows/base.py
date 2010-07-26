#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.actions import ActionContext
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
        
        self._ext_name = 'Ext.m3.Window'
        
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
        self.parent_window_id = ''
        self.keys = []
        self.auto_load = None
        self.hidden = True
        
    def render_base_config(self):
        super(BaseExtWindow, self).render_base_config()
        self._put_config_value('title', self.title)
        self._put_config_value('modal', self.modal)
        self._put_config_value('maximized', self.maximized)
        self._put_config_value('minimized', self.minimized)
        self._put_config_value('minimizable', self.minimizable)
        self._put_config_value('maximizable', self.maximizable)
        self._put_config_value('closable', self.closable)
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('bodyStyle', self.body_style)
        self._put_config_value('layout', self.layout)
        self._put_config_value('tbar', self.t_render_top_bar, self.top_bar)
        self._put_config_value('bbar', self.t_render_buttom_bar, self.buttom_bar)
        self._put_config_value('fbar', self.t_render_footer_bar, self.footer_bar)
        self._put_config_value('items', self.t_render_items)
        self._put_config_value('buttons', self.t_render_buttons, self.buttons)
        self._put_config_value('resizable', self.resizable)
        #self._put_config_value('parentWindowID', self.parent_window_id)
        self._put_config_value('keys', self.t_render_keys, self.keys)
        #self._put_config_value('autoLoad', self.auto_load) -- не используется
        
    def render_params(self):
        super(BaseExtWindow, self).render_params()
        self._put_params_value('parentWindowID', self.parent_window_id)
        
    @property
    def buttons(self):
        return self.__buttons
    
    @property
    def items(self):
        return self.__items
        
    def t_render_items(self):
        return '[%s]' % ','.join([item.render() for item in self.items])    
        
    def t_render_buttons(self):
        return '[%s]' % ','.join([button.render() for button in self.buttons])
    
    def t_render_top_bar(self):
        return self.top_bar.render()
    
    def t_render_buttom_bar(self):
        return self.buttom_bar.render()
    
    def t_render_footer_bar(self):
        return self.footer_bar.render()
    
    def pre_render(self):
        super(BaseExtWindow, self).pre_render()
        if hasattr(self.action_context,'m3_window_id'):
            self.parent_window_id = self.action_context.m3_window_id
        children = [] 
        children.extend(self.items)
        children.extend(self.buttons)
        children.append(self.top_bar)
        children.append(self.footer_bar)
        for child in children:
            if child:                
                child.action_context = self.action_context
                if child.action_context:
                    child.action_context.m3_window_id = self.client_id
                else:
                    child.action_context = ActionContext()
                    child.action_context.m3_window_id = self.client_id
    
    def render_globals(self):
        if self.template_globals:
            return render_template(self.template_globals, {'component': self, 
                                                           'window': self})
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
    
    def t_render_keys(self):
        return ','.join(['{%s}' % ','.join(['%s:%s' % (k,v) for k, v in key.items()]) for key in self.keys])        
    

    