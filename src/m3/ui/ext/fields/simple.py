#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
@author: prefer
'''

from m3.helpers import normalize

from base import BaseExtField, BaseExtTriggerField   
from m3.ui.ext import render_component
        
        
class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-string-field.js'
        self.input_type = None
        self.mask_re = None
        self.init_component(*args, **kwargs)


class ExtDateField(BaseExtField):
    '''Поле ввода даты'''
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-date-field.js'
        self.format = None
        self.init_component(*args, **kwargs)
    
    
class ExtNumberField(BaseExtField):
    '''Поле ввода числового значения'''
    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-number-field.js'
        # Свойства валидации специфичные для чисел
        self.allow_decimals = True
        self.allow_negative = True
        self.decimal_precision = None
        self.max_value = None
        self.max_text = None
        self.min_value = None
        self.min_text = None
        self.init_component(*args, **kwargs)
        
        
class ExtHiddenField(BaseExtField):
    ''' Скрытое поле, которое не видно пользователю на форме, но хранит значение и передает его при submit'е '''
    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-hidden-field.js'
        self.init_component(*args, **kwargs)
       
class ExtTextArea(BaseExtField):
    '''Большое :) Текстовое поле'''
    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-text-area.js'
        self.init_component(*args, **kwargs)

    def render(self):
        if self.value:
            self.value = normalize(self.value)
        return super(ExtTextArea, self).render()

class ExtCheckBox(BaseExtField):
    '''Галочка выбора значения'''
    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-checkbox.js'
        self.checked = False
        self.init_component(*args, **kwargs)
        
        
class ExtComboBox(BaseExtTriggerField):
    '''Поле выпадающий список - combobox'''
    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-combo.js'
        self.init_component(*args, **kwargs)
        
        
class ExtTimeField(BaseExtField):
    '''Поле ввода времени'''
    def __init__(self, *args, **kwargs):
        super(ExtTimeField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-time-field.js'
        self.format = None
        self.increment = None
        self.init_component(*args, **kwargs)