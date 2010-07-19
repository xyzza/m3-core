#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
@author: prefer
'''

from django.conf import settings
from datetime import datetime

from m3.helpers import normalize

from base import BaseExtField, BaseExtTriggerField

        
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

    def render_base_config(self):
        res = super(ExtStringField, self).render_base_config()
        res += ',inputType: "%s"' % self.input_type if self.input_type else ''
        res += ',maskRe: "%s"' % self.mask_re if self.mask_re else ''
        return res

class ExtDateField(BaseExtField):
    '''Поле ввода даты'''
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-date-field.js'
        self.hide_today_btn = False
        
        # ситуация следующая:
        # При установке своего формата, необходимо устанавливать также
        # отформатированную дату, если она нужна по умолчанию
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
            self.value = datetime.now().strftime(settings.DATE_FORMAT)
        except:
            self.format = 'd.m.Y'
            self.value = datetime.now().strftime('%d.%m.%Y')
            
            
        self.init_component(*args, **kwargs)
    
    def render_base_config(self):
        res = super(ExtDateField, self).render_base_config()
        res += ',format: "%s"' % self.format if self.format else ''
        return res
    
    def render_params(self):
        res = super(ExtDateField, self).render_params()
        res += ',' if res else ''
        res += 'hideTriggerToday: %s' % str(self.hide_today_btn).lower()
        return res
    
    def render(self):
        return 'createAdvancedDataField({%s},{%s})' \
            % (self.render_base_config(), self.render_params() )
    
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
    INT = 0
    STRING = 1
    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-hidden-field.js'
        self.type = ExtHiddenField.INT 
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
        # max и min допустимые значения времени. Задаются только в виде строки, 
        # т.к. форматы времени в python'e и javascript'e разные
        self.max_value = None
        self.min_value = None
        self.init_component(*args, **kwargs)