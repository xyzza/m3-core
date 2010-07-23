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
    
    def render_base_config(self):
        super(ExtWindow, self).render_base_config()
        if self.layout_config:
            self._put_config_value('layoutConfig', self.t_render_layout_config())
    
    # Данный код должен находится в базовом классе, но т.к. не ве шаблоны 
    # переведены на новый рендеринг, остается пока в каждом 
    def render(self):
        self.pre_render()
        
        try:
            self.render_base_config()

        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        return  'new Ext.Window({%s})' %  base_config