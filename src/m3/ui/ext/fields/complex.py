#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from base import BaseExtField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.ext.fields import ExtComboBox


class ExtDictSelectField(ExtComboBox):
    '''Поле с выбором из справочника'''
    def __init__(self, *args, **kwargs):
        # Т.к. используется возможность передачи комбобоксовских значений в контруктор
        url = kwargs.pop('url', None)
        ask_before_deleting = kwargs.pop('ask_before_deleting', None)
        autocomplete_url = kwargs.pop('autocomplete_url', None)
        self.default_text = kwargs.pop('default_text', '')
        
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js'

        self.hide_trigger=True 
        self.type_ahead=True 
        self.min_chars = 2
        self.read_only = True
        self.set_store(ExtJsonStore())
        self.handler_change = 'onChange'
        self.width = 150
        
        self.select_button = ExtButton(handler='onSelect', icon_cls='select', disabled=True)
        self.clear_button = ExtButton(handler='onClearField', icon_cls='clear', hidden=True)                                  
        
        self.ask_before_deleting = ask_before_deleting
        self.url = url
        self.autocomplete_url = autocomplete_url
        
        self.init_component(*args, **kwargs)
        # По умолчанию 20 - ширина двух кнопок
        # Чтобы компонент умещался в передоваемую ширину
        self.width -= 20
        
    @property
    def url(self):
        return self.__url
    
    @url.setter
    def url(self, value):
        if value:
            self.select_button.disabled = False
        self.__url = value
        
    @property
    def autocomplete_url(self):
        return self.__autocomplete_url
    
    @autocomplete_url.setter
    def autocomplete_url(self, value):
        if value:
            self.read_only = False
            self.set_store(ExtJsonStore(url=value))
        self.__autocomplete_url = value
    