#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtWindow

class ExtWindow(BaseExtWindow):
    def __init__(self, *args, **kwargs):
        super(ExtWindow, self).__init__(*args, **kwargs)
        self.layout_config = {}
        self.init_component(*args, **kwargs)
        
    def t_render_layout_config(self):
        '''Рендерит конфиг, если указан layout'''
        return '{%s}' % ','.join(['%s:"%s"' % (k, v) for k, v in self.layout_config.items()])
    