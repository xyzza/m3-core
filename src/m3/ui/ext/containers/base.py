#coding:utf-8
'''
Created on 25.02.2010

@author: prefer <telepenin@bars-open.ru>
'''

from m3.ui.ext.base import ExtUIComponent
from m3.helpers.datastructures import TypedList

class BaseExtContainer(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        '''
        Базовый класс для контейнерных компонентов
        
        @version: 0.1
        @begin_designer
        {abstract: true
        ,attr: [{
            ext_attr: "layout"
            ,py_attr: "layout" 
        },{
            ext_attr: "layoutConfig"
            ,py_attr: "layout_config" 
            ,attr: {
                 ext_attr: "forceFit"
                ,py_attr: "force_fit" 
            }
        }]}
        @end_designer
        '''
        super(BaseExtContainer, self).__init__(*args, **kwargs)
        self.layout = None
        self.layout_config = {}
        self._items = TypedList(type = ExtUIComponent)
        
    def t_render_items(self):
        ''' Дефолтный рендеринг вложенных объектов'''
        return '[%s]' % ','.join([item.render() for item in self._items])
        
    def find_by_name(self, name):
        '''Осуществляет поиск экземпляра во вложенных объектах по имени экземпляра'''
        for item in self.items:   
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item
                
            if hasattr(item, 'items'):
                res = item.find_by_name(name)
                if res:
                    return res
                
    def t_render_layout_config(self):
        '''Рендерит конфиг, если указан layout'''
        return '{%s}' % ','.join(['%s:"%s"' % (k, v) for k, v in self.layout_config.items()])
    
    def pre_render(self):
        super(BaseExtContainer, self).pre_render()
        
        # выставляем action_context у дочерних элементов
        for item in self._items:
            if item:
                item.action_context = self.action_context
    
    def render_base_config(self):
        super(BaseExtContainer, self).render_base_config()
        self._put_config_value('layoutConfig', 
                                      self.t_render_layout_config,
                                      self.layout)
        self._put_config_value('layout', self.layout)
    
        
class BaseExtPanel(BaseExtContainer):
    '''
    Базовый класс для визуальных контейнерных компонентов
    
    @version: 0.1
    @begin_designer
    {abstract: true
    ,attr: [{
        ext_attr: "title"
        ,py_attr: "title" 
    },{
        ext_attr: "header"
        ,py_attr: "header" 
    },{
        ext_attr: "iconCls"
        ,py_attr: "icon_cls" 
    },{
        ext_attr: "tbar"
        ,py_attr: "top_bar" 
    },{
        ext_attr: "bbar"
        ,py_attr: "bottom_bar" 
    },{
        ext_attr: "fbar"
        ,py_attr: "footer_bar" 
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)
        self.title = None
        self.header = False
        self.icon_cls = None
        self.top_bar = None
        self.bottom_bar = None
        self.footer_bar = None

    def t_render_top_bar(self):
        return self.top_bar.render()
    
    def t_render_bottom_bar(self):
        return self.bottom_bar.render()
    
    def t_render_footer_bar(self):
        return self.footer_bar.render()
    
    def render_base_config(self):
        super(BaseExtPanel, self).render_base_config()
        self._put_config_value('title', self.title)
        if not self.title:
            self._put_config_value('header', self.header)
            
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('tbar', self.t_render_top_bar, 
                                      self.top_bar)
        self._put_config_value('bbar', self.t_render_bottom_bar, 
                                      self.bottom_bar)
        self._put_config_value('fbar', self.t_render_footer_bar,
                                      self.footer_bar)
        
        