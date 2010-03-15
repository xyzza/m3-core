#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtContainer

class ExtContainer(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render(self):
        pass
