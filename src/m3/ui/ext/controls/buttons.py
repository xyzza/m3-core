#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtControl
from m3.ui.ext.misc import ExtConnection

class ExtButton(BaseExtControl):
    '''Кнопка'''
    def __init__(self, *args, **kwargs):
        super(ExtButton, self).__init__(self, *args, **kwargs)
        self.template = 'ext-controls/ext-button.js'
        self.text = None
        self.handler = None
        self.icon = None
        self.icon_cls = None
        self.tooltip_title = None
        self.tooltip_text = None
        self.menu = None
        self.tab_index = None
        self.init_component(*args, **kwargs)
    
    def t_render_handler(self):
        if isinstance(self.handler, ExtConnection):
            return 'function(){%s}'% self.handler.render()
        else:
            return self.handler
        
    def t_render_tooltip(self):
        res = ''
        if self.tooltip_text:
            res += 'text: "%s"' % self.tooltip_text 
        if self.tooltip_title:
            res += ',title: "%s"' % self.tooltip_title 
        return '{%s}' % res
    
    def render_base_config(self):
        super(ExtButton, self).render_base_config()
        self._put_config_value('text', self.text)
        self._put_config_value('icon', self.icon)
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('region', self.region)
        self._put_config_value('flex', self.flex)
        self._put_config_value('tooltip', self.t_render_tooltip, 
                                                self.tooltip_text)
        
        self._put_config_value('tabIndex', self.tab_index)
        self._put_config_value('handler', self.t_render_handler, self.handler)
        if self.menu:
            self._put_config_value('menu', self.menu.render)

        
        
    def render(self):
        self._ext_name = 'Ext.SplitButton' if self.menu else 'Ext.Button'
        return super(ExtButton, self).render()
    