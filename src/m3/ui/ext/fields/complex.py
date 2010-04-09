#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from base import BaseExtField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.ext.fields import ExtComboBox


class ExtDictSelectField(BaseExtField):
    '''Поле с выбором из справочника'''
    def __init__(self, width=None, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js' 
        self.ask_before_deleting = True
        self.__url = None
        self.__autocomplete_url = None
        
        # Передадим копию kwargs в конструктор комбобокса, все же не зря наследовались
        # и удалим не нужные ключи 
        dict_combo = kwargs.copy()
        if dict_combo.has_key('url'): del dict_combo['url']
        if dict_combo.has_key('ask_before_deleting'): del dict_combo['ask_before_deleting']
        if dict_combo.has_key('autocomplete_url'): del dict_combo['autocomplete_url']
        
        self.combo_box = ExtComboBox(read_only = True, **dict_combo)
        self.combo_box.set_store(ExtJsonStore(url='', auto_load=False))
        if width:
            # По умолчанию 40 - ширина двух кнопок
            # Чтобы компонент умещался в передоваемую ширину
            self.combo_box.width = (width - 40) if width > 40 else width
        
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
        self.combo_box.read_only = False
        self.combo_box.set_store(ExtJsonStore(url=value))
        self.__autocomplete_url = value
    