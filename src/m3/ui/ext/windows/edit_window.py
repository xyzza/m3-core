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
        self.init_component(*args, **kwargs)
        
    #=======================================================================
    # Свойство класса form
    #=======================================================================
    def __set_form(self, value):
        self.top_container = value
        self.__form = value
    
    def __get_form(self):
        return self.__form
    
    form = property(__get_form, __set_form)
    #=======================================================================
    
    
