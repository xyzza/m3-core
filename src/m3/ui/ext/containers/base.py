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
        
class BaseExtPanel(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)
        self.title = None
        self.icon_cls = None
