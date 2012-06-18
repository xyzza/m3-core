#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
@author: prefer
'''

from django.conf import settings
from datetime import datetime, date

from helpers import date2str

from base import BaseExtField, BaseExtTriggerField

#===============================================================================        
class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)        
        
        #
        self.enable_key_events = False # Разрешает перехват нажатий клавиш
        
        #
        self.input_type = None
        
        #
        self.mask_re = None
        
        #
        self.select_on_focus = None
        
        # маска ввода, например "(###)###-##-##"
        # форматирует строку при вводе
        self.input_mask = None
        
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        if self.input_mask:
            self.plugins.append("new Ext.ux.Mask('%s')" % self.input_mask)

        # Экранирование значений с обратным слешем
        # Кавычки, апострафы, символы переноса строки и т.д. отрежутся функцией normalize в helpers/__init__.py
        self.value = self.value.replace('\\','\\\\')

        super(ExtStringField, self).render_base_config()
        self._put_config_value('inputType', self.input_type)
        self._put_config_value('maskRe', self.t_render_mask_re, self.mask_re)
        self._put_config_value('selectOnFocus', self.select_on_focus)
        self._put_config_value('enableKeyEvents', self.enable_key_events, self.enable_key_events)
        

    def t_render_mask_re(self):
        return '/%s/' % self.mask_re

    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.TextField({%s})' % base_config

#===============================================================================
class ExtDateField(BaseExtField):
    '''
    Поле ввода даты
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        
        #
        self.start_day = 1 # атрибут задает с какого дня начинается неделя в календаре.
                            # 0-Воскресенье, 1-Понедельник, 2-Вторник и т.д.
        
        #
        self.hide_today_btn = False
        
        #
        self.enable_key_events = False # Разрешает перехват нажатий клавиш

        #
        self.max_value = None

        #
        self.min_value = None

        #
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
        except:
            self.format = 'd.m.Y'
            
        self.init_component(*args, **kwargs)
    
    def render_base_config(self):
        if isinstance(self.value, datetime) or isinstance(self.value, date):
            try:
                value = self.value.strftime(settings.DATE_FORMAT)
            except:
                value = date2str(self.value)
        else:
            value = self.value
        
        super(ExtDateField, self).render_base_config()
        self._put_config_value('format', self.format)
        self._put_config_value('value', value)
        self._put_config_value('enableKeyEvents', self.enable_key_events, self.enable_key_events)
        self._put_config_value('startDay', self.start_day)
        self._put_config_value('maxValue', self.max_value)
        self._put_config_value('minValue', self.min_value)

    def render_params(self):
        super(ExtDateField, self).render_params()
        self._put_params_value('hideTriggerToday', self.hide_today_btn)

    def render(self):
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedDataField({%s},{%s})' % (base_config, params)

#===============================================================================    
class ExtNumberField(BaseExtField):
    '''
    Поле ввода числового значения
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        
        # Свойства валидации специфичные для чисел
        # Разделитель целой и дробной части
        self.decimal_separator = None
        
        # Признак, что может быть дробная часть
        self.allow_decimals = True
        
        # Признак, что могут быть отрицательные значения
        self.allow_negative = True
        
        # Точность дробной части
        self.decimal_precision = None
        
        # Маскимально возможное значение
        self.max_value = None
        
        # Если превышено максимально возможное значение, то будет отображаться этот текст
        self.max_text = None
        
        # Минимальное возможное значение 
        self.min_value = None
        
        # Если превышено минимальное возможное значение, то будет отображаться этот текст
        self.min_text = None
        
        # Разрешает перехват нажатий клавиш
        self.enable_key_events = False

        # Выделение всего содержимого при попадании в фокус
        self.select_on_focus = None
        
        self.init_component(*args, **kwargs)
        
        
    def render_base_config(self):
        super(ExtNumberField, self).render_base_config()
        self._put_config_value('decimalSeparator', self.decimal_separator)
        self._put_config_value('allowDecimals', self.allow_decimals)        
        self._put_config_value('allowNegative', self.allow_negative)
        self._put_config_value('decimalPrecision', self.decimal_precision)
        self._put_config_value('minValue', self.min_value)
        self._put_config_value('maxValue', self.max_value)
        self._put_config_value('maxText', self.max_text)
        self._put_config_value('minText', self.min_text)        
        self._put_config_value('selectOnFocus', self.select_on_focus)
        self._put_config_value('enableKeyEvents', self.enable_key_events)
        
    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.NumberField({%s})' % base_config


#===============================================================================
class ExtHiddenField(BaseExtField):
    ''' 
    Скрытое поле, которое не видно пользователю на форме, но хранит значение
     и передает его при submit'е 
     '''
     
    # Тип поля - integer
    INT = 0
    
    # Тип поля - string
    STRING = 1
    
    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-hidden-field.js' #TODO: Необходимо отрефакторить под внутриклассовый рендеринг
        
        # Тип поля
        self.type = ExtHiddenField.INT 
        
        self.init_component(*args, **kwargs)

#===============================================================================       
class ExtTextArea(BaseExtField):
    '''
    Большое :) Текстовое поле
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)
        
        # Фильтр допустимых символов по регекспу
        self.mask_re = None
        self.init_component(*args, **kwargs)
        
        # DOM-атрибуты
        self.auto_create = {"tag": "textarea", "autocomplete": "off"}
    
    def t_render_mask_re(self):
        return '/%s/' % self.mask_re

    def render_base_config(self):       
        super(ExtTextArea, self).render_base_config()
        self._put_config_value('maskRe', self.t_render_mask_re, self.mask_re)
        
    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.TextArea({%s})' % base_config

#===============================================================================
class ExtCheckBox(BaseExtField):
    '''
    Галочка выбора значения
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-checkbox.js' #TODO: Необходимо отрефакторить под внутриклассовый рендеринг
        
        # Признак того, что значение выбрано
        self.checked = False
        
        # Текст рядом с полем выбора значения 
        self.box_label = None
        
        self.init_component(*args, **kwargs)
        
    @property
    def handler_check(self):
        return self._listeners.get('check')
    
    @handler_check.setter
    def handler_check(self, function):
        self._listeners['check'] = function
        
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.read_only = access_off

#===============================================================================
class ExtRadio(BaseExtField):
    '''
    Радио-поле
    '''

    def __init__(self, *args, **kwargs):
        super(ExtRadio, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.form.Radio'

        # Признак того, что значение выбрано
        self.checked = False

        # Текст рядом с полем выбора значения 
        self.box_label = None
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        value = self.value
        self.value = None
        super(ExtRadio, self).render_base_config()
        if self.checked:
            self._put_config_value('checked', True)
        if self.box_label:
            self._put_config_value('boxLabel', self.box_label)
        self._put_config_value('inputValue', value)

    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new %s({%s})' % (self._ext_name, base_config)

#===============================================================================        
class ExtComboBox(BaseExtTriggerField):
    '''
    Поле выпадающий список - combobox
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)        
        self.init_component(*args, **kwargs)
        
    def render(self):
        try:
            self.render_base_config()
            
        except UnicodeDecodeError as msg:
            raise Exception(msg)
       
        base_config = self._get_config_str()
        return 'new Ext.form.ComboBox({%s})' % base_config


#===============================================================================
class ExtTimeField(BaseExtField):
    """
    Поле ввода времени
    """
    def __init__(self, *args, **kwargs):
        super(ExtTimeField, self).__init__(*args, **kwargs)
        
        # Формат отображения времени
        self.format = None
        
        # Шаг повышения времени
        self.increment = None
        
        # max и min допустимые значения времени. Задаются только в виде строки, 
        # т.к. форматы времени в python'e и javascript'e разные
        self.max_value = self.min_value = None         
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(ExtTimeField, self).render_base_config()
        self._put_config_value('format', self.format)
        self._put_config_value('increment', self.increment)
        self._put_config_value('max_value', self.max_value)
        self._put_config_value('min_value', self.min_value)

    def render(self):
        self.render_base_config()
        base_config = self._get_config_str()
        return 'new Ext.form.TimeField({%s})' % base_config

#===============================================================================        
class ExtHTMLEditor(BaseExtField):
    '''
    Поле HTML-редактор
    '''
    
    def __init__(self, *args, **kwargs):
        super(ExtHTMLEditor, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render_base_config(self):
        super(ExtHTMLEditor, self).render_base_config()
        
    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.HtmlEditor({%s})' % base_config

#===============================================================================
class ExtDisplayField(BaseExtField):
    '''
    Поле отображающее значение (не проверяется и не сабмитится)
    '''
    def __init__(self, *args, **kwargs):
        super(ExtDisplayField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render_base_config(self):
        super(ExtDisplayField, self).render_base_config()
        
        # Для данного класса установка дополнительно css класса при read_only - 
        # излишне
        if self.read_only:
            self._set_config_value('cls', None)
        
    def render(self):
        try:
            self.render_base_config()
        except UnicodeDecodeError as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.DisplayField({%s})' % base_config


class ExtDateTimeField(ExtDateField):

    def __init__(self, *args, **kwargs):
        super(ExtDateTimeField, self).__init__(*args, **kwargs)

    def render(self):
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'new Ext.ux.form.DateTimeField({%s},{%s})' % (base_config, params)

class ExtAdvTimeField(BaseExtField):

    def render(self):
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError as msg:
            raise Exception(msg)

        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'new Ext.ux.form.AdvTimeField({%s},{%s})' % (base_config, params)