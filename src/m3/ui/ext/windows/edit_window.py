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
    @property
    def form(self):
        return self.__form
 
    @form.setter
    def form(self, value):
        self.items.append(value)
        self.__form = value
    #=======================================================================
    
    
