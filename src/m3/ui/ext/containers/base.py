#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent
from m3.helpers.datastructures import TypedList


class BaseExtContainer(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtContainer, self).__init__(*args, **kwargs)
        self.layout = None
        self.layout_config = {}
        self._items = TypedList(type = ExtUIComponent)
        
    def t_render_items(self):
        ''' Дефолтный рендеринг вложенных объектов'''
        return ','.join([item.render() for item in self._items])
        
    def find_by_name(self, name):
        '''Осуществляет поиск экземпляра во вложенных объектах по имени экземпляра'''
        for item in self._items:   
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item
                
            if hasattr(item, '_items'):
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
        res = super(BaseExtContainer, self).render_base_config()
        res += ',layoutConfig: %s' \
            % self.t_render_layout_config() if self.layout_config else ''
        res += ',layout: "%s"' % self.layout if self.layout else ''
        return res
    
        
class BaseExtPanel(BaseExtContainer):
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
        res = super(BaseExtPanel, self).render_base_config()
        res += ',title:"%s"' % self.title if self.title else ''
        res += ',header:"%s"' % self.header if self.header else ''
        res += ',iconCls:"%s"' % self.icon_cls if self.icon_cls else ''
        res += ',tbar:%s' % self.t_render_top_bar() if self.top_bar else ''
        res += ',bbar:%s' % self.t_render_bottom_bar() if self.bottom_bar else ''
        res += ',fbar:%s' % self.t_render_footer_bar() if self.footer_bar else ''
        return res