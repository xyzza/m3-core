#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from base import BaseExtField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtDataStore, ExtJsonStore
from m3.ui.ext.fields import ExtComboBox


class ExtDictSelectField(BaseExtField):
    '''Поле с выбором из справочника'''
    def __init__(self, width=None, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js'

        # Т.к. используется возможность передачи комбобоксовских значений в контруктор
        url = kwargs.pop('url', None)
        ask_before_deleting = kwargs.pop('ask_before_deleting', None)
        autocomplete_url = kwargs.pop('autocomplete_url', None)
        
        self.combo_box = ExtComboBox(hide_trigger=True, type_ahead=True, **kwargs)
        self.combo_box.set_store(ExtDataStore())
        self.combo_box.handler_change = 'onChange'
        
        if width:
            # По умолчанию 40 - ширина двух кнопок
            # Чтобы компонент умещался в передоваемую ширину
            self.combo_box.width = (width - 40) if width > 40 else width
        
        self.select_button = ExtButton(handler='onSelect', icon_cls='select', disabled=True)
        self.clear_button = ExtButton(handler='onClearField', icon_cls='clear', hidden=True)                                  
        
        self.ask_before_deleting = ask_before_deleting
        self.url = url
        self.autocomplete_url = autocomplete_url
        
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
        self.combo_box.read_only = False
        self.combo_box.set_store(ExtJsonStore(url=value))
        self.__autocomplete_url = value
    