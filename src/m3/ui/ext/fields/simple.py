#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField 
from m3.ui.ext.misc import ExtDataStore      
from m3.ui.ext import render_component
        
class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-string-field.js'
        self.input_type = None
        
		# Свойства валидации, специфичные для TextField
        self.allow_blank = True
        self.vtype= None
        self.min_length = self.min_length_text = None
        self.max_length = self.max_length_text = None
        self.regex      = self.regex_text      = None
        self.init_component(*args, **kwargs)


class ExtDateField(BaseExtField):
    '''Поле ввода даты'''
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-date-field.js'
        self.init_component(*args, **kwargs)
    
class ExtNumberField(BaseExtField):
    '''Поле ввода числового значения'''
    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-number-field.js'
        self.init_component(*args, **kwargs)
    
class ExtComboBox(BaseExtField):
    '''Поле комбобокс'''
    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-combo.js'
        self.display_field = None
        self.__store = None
        self.empty_text = None
        self.mode = None
        self.init_component(*args, **kwargs)
    
    def set_store(self, store):
        if isinstance(store, ExtDataStore):
            self.mode = 'local'
            self.__store = store
        else:
            self.mode = 'remote'
            self.__store = store    
        
    def t_render_store(self):
        return self.__store.render([self.display_field,])       
        
class ExtTextArea(BaseExtField):
    '''Большое :) Текстовое поле'''
    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-textarea.js'
        self.init_component(*args, **kwargs)

class ExtCheckBox(BaseExtField):
    '''Галочка выбора значения'''
    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-checkbox.js'
        self.checked = False
        self.init_component(*args, **kwargs)