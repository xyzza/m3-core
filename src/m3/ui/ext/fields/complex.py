#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from base import BaseExtField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtConnection


class ExtDictSelectField(BaseExtField):
    '''Поле с выбором из справочника'''
    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js' 
        self.ask_before_deleting = True
        self.__url = None
        self.__autocomplete_url = None
        self.select_button = ExtButton(handler='onSelect', icon_cls='select', disabled=True)
        self.clean_button = ExtButton(handler='onClearField', icon_cls='clear')                                  
        self.init_component(*args, **kwargs)
        
    @property
    def url(self):
        return self.__url
    
    @url.setter
    def url(self, value):
        self.select_button.disabled = False
        self.__url = value
        
    @property
    def autocomplete_url(self):
        return self.__autocomplete_url
    
    @autocomplete_url.setter
    def autocomplete_url(self, value):
        self.__autocomplete_url = value
    