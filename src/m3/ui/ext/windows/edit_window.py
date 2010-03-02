#coding:utf-8
'''
Created on 02.03.2010

@author: akvarats
'''

from base import BaseExtWindow

class ExtEditWindow(BaseExtWindow):
    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.__form = None
        self.renderer.template = 'ext-script/ext-editwindowscript.js' 
        
    #=======================================================================
    # Свойство класса form
    #=======================================================================
    def _set_form(self, value):
        self.top_container = value
        self.__form = value
    
    def _get_form(self):
        return self.__form
    
    form = property(_get_form, _set_form)
    
    
