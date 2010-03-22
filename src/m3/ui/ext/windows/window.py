#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtWindow

class ExtWindow(BaseExtWindow):
    def __init__(self, *args, **kwargs):
        super(ExtWindow, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
    