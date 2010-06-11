#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''

from m3.ui.ext.base import ExtUIComponent

class BaseExtStore(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtStore, self).__init__(*args, **kwargs)
        self._base_params = {}
        self.auto_load = False
        self.url = ''
        self.writer = None
        
    def _set_base_params(self, params):
        self._base_params.update(params)
        
    def _get_base_params(self):
        return self._base_params

    base_params = property(_get_base_params, _set_base_params)