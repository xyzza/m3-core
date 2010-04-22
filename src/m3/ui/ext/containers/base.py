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
        
class BaseExtPanel(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)
        self.title = None
        self.icon_cls = None
        self.top_bar = None
        self.buttom_bar = None
        self.footer_bar = None

    def t_render_top_bar(self):
        return self.top_bar.render()
    
    def t_render_buttom_bar(self):
        return self.buttom_bar.render()
    
    def t_render_footer_bar(self):
        return self.footer_bar.render()