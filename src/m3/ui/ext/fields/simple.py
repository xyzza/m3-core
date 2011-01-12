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

#===============================================================================        
class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    
    @version: 0.1
    @begin_designer
    {title: "Text field"
    ,ext_class: "Ext.form.TextField"
    ,xtype: "textfield"
    ,attr: [{
        ext_attr: "inputType"
        ,py_attr: "input_type" 
    },{
        ext_attr: "maskRe"
        ,py_attr: "mask_re"
    },{
        ext_attr: "iconCls"
        ,py_attr: "icon_cls"
    },{
        ext_attr: "menu"
        ,py_attr: "menu"
    },{
        ext_attr: "tabIndex"
        ,py_attr: "tab_index"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-string-field.js'
        self.enable_key_events = False # Разрешает перехват нажатий клавиш
        self.input_type = None
        self.mask_re = None
        self.select_on_focus = None
        self.init_component(*args, **kwargs)

    def render_base_config(self):
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
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.TextField({%s})' % base_config

#===============================================================================
class ExtDateField(BaseExtField):
    '''
    Поле ввода даты
    
    @version: 0.1
    @begin_designer
    {title: "Advanced data field"
    ,xtype: "advanceddatefield"
    ,attr: [{
        ext_attr: "startDay"
        ,py_attr: "start_day"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-date-field.js'
        self.start_day = 1 # атрибут задает с какого дня начинается неделя в календаре.
                            # 0-Воскресенье, 1-Понедельник, 2-Вторник и т.д.
        self.hide_today_btn = False
        self.enable_key_events = False # Разрешает перехват нажатий клавиш
        #self.value =  datetime.now()  # -- решили не использовать (c) prefer 
        
        try:
            self.format = settings.DATE_FORMAT.replace('%', '')
        except:
            self.format = 'd.m.Y'
            
        self.init_component(*args, **kwargs)
    
    def render_base_config(self):
        if isinstance(self.value, datetime):
            try:
                value = self.value.strftime(settings.DATE_FORMAT)
            except:
                value = self.value.strftime('%d.%m.%Y')
        else:
            value = self.value
        
        super(ExtDateField, self).render_base_config()
        self._put_config_value('format', self.format)
        self._put_config_value('value', value)
        self._put_config_value('enableKeyEvents', self.enable_key_events, self.enable_key_events)
        self._put_config_value('startDay', self.start_day)

    def render_params(self):
        super(ExtDateField, self).render_params()
        self._put_params_value('hideTriggerToday', self.hide_today_btn)
    
    def render(self):
        try:
            self.render_base_config()
            self.render_params()
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedDataField({%s},{%s})' % (base_config, params)

#===============================================================================    
class ExtNumberField(BaseExtField):
    '''
    Поле ввода числового значения
    
    @version: 0.1
    @begin_designer
    {title: "Number field"
    ,ext_class: "Ext.form.NumberField"
    ,xtype: "numberfield"
    ,attr: [{
        ext_attr: "allowDecimals"
        ,py_attr: "allow_decimals" 
    },{
        ext_attr: "allowNegative"
        ,py_attr: "allow_negative"
    },{
        ext_attr: "decimalPrecision"
        ,py_attr: "decimal_precision"
    },{
        ext_attr: "maxValue"
        ,py_attr: "max_value"
    },{
        ext_attr: "maxText"
        ,py_attr: "max_text"
    },{
        ext_attr: "minValue"
        ,py_attr: "min_value"
    },{
        ext_attr: "minText"
        ,py_attr: "min_text"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        #self.template = 'ext-fields/ext-number-field.js'
        # Свойства валидации специфичные для чисел
        self.allow_decimals = True
        self.allow_negative = True
        self.decimal_precision = None
        self.max_value = None
        self.max_text = None
        self.min_value = None
        self.min_text = None
        self.init_component(*args, **kwargs)
        
        
    def render_base_config(self):
        super(ExtNumberField, self).render_base_config()
        self._put_config_value('allowDecimals', self.allow_decimals)
        self._put_config_value('allowNegative', self.allow_negative)
        self._put_config_value('decimalPrecision', self.decimal_precision)
        self._put_config_value('minValue', self.min_value)
        self._put_config_value('maxValue', self.max_value)
        self._put_config_value('maxText', self.max_text)
        self._put_config_value('minText', self.min_text)
        self._put_config_value('minText', self.min_text)
        
    def render(self):
        try:
            self.render_base_config()
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.NumberField({%s})' % base_config
        
#===============================================================================        
class ExtHiddenField(BaseExtField):
    ''' 
    Скрытое поле, которое не видно пользователю на форме, но хранит значение
     и передает его при submit'е 
     
    @version: 0.1
    @begin_designer
    {title: "Hidden field"
    ,ext_class: "Ext.form.Hidden"
    ,xtype: "hidden"
    }
    @end_designer
     '''
    INT = 0
    STRING = 1
    def __init__(self, *args, **kwargs):
        super(ExtHiddenField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-hidden-field.js'
        self.type = ExtHiddenField.INT 
        self.init_component(*args, **kwargs)

#===============================================================================       
class ExtTextArea(BaseExtField):
    '''
    Большое :) Текстовое поле
    
    @version: 0.1
    @begin_designer
    {title: "Text area"
    ,ext_class: "Ext.form.TextArea"
    ,xtype: "textarea"
    ,attr: [{
        ext_attr: "maskRe"
        ,py_attr: "mask_re" 
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTextArea, self).__init__(*args, **kwargs)
        self.mask_re = None
        self.init_component(*args, **kwargs)
    
    def t_render_mask_re(self):
        return '/%s/' % self.mask_re

    def render_base_config(self):
        if self.value:
            self.value = normalize(self.value)
        
        super(ExtTextArea, self).render_base_config()
        self._put_config_value('maskRe', self.t_render_mask_re, self.mask_re)
        
    def render(self):
        try:
            self.render_base_config()
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.TextArea({%s})' % base_config

#===============================================================================
class ExtCheckBox(BaseExtField):
    '''
    Галочка выбора значения
    
    @version: 0.1
    @begin_designer
    {title: "Check box"
    ,ext_class: "Ext.form.Checkbox"
    ,xtype: "checkbox"
    ,attr: [{
        ext_attr: "checked"
        ,py_attr: "checked" 
    },{
        ext_attr: "boxLabel"
        ,py_attr: "box_label" 
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtCheckBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-checkbox.js'
        self.checked = False
        self.box_label = None
        self.init_component(*args, **kwargs)
        
    @property
    def handler_check(self):
        return self._listeners.get('check')
    
    @handler_check.setter
    def handler_check(self, function):
        self._listeners['check'] = function
        
#===============================================================================        
class ExtComboBox(BaseExtTriggerField):
    '''
    Поле выпадающий список - combobox
    
    @version: 0.1
    @begin_designer
    {title: "Combo box"
    ,ext_class: "Ext.form.ComboBox"
    ,xtype: "combo"
    }
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)
        #self.template = 'ext-fields/ext-combo.js'
        self.init_component(*args, **kwargs)
        
    def render(self):
        try:
            self.render_base_config()
            
        except Exception as msg:
            raise Exception(msg)
       
        base_config = self._get_config_str()
        return 'new Ext.form.ComboBox({%s})' % base_config

#===============================================================================        
class ExtTimeField(BaseExtField):
    '''
    Поле ввода времени
    
    @version: 0.1
    @begin_designer
    {title: "Time field"
    ,ext_class: "Ext.form.TimeField"
    ,xtype: "timefield"
    ,attr: [{
        ext_attr: "format"
        ,py_attr: "format" 
    },{
        ext_attr: "increment"
        ,py_attr: "increment" 
    },{
        ext_attr: "maxValue"
        ,py_attr: "max_value" 
    },{
        ext_attr: "minValue"
        ,py_attr: "min_value" 
    }]}
    @end_designer
    '''
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
        
class ExtHTMLEditor(BaseExtField):
    '''Поле HTML-редактор'''
    def __init__(self, *args, **kwargs):
        super(ExtHTMLEditor, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render_base_config(self):
        super(ExtHTMLEditor, self).render_base_config()
        
    def render(self):
        try:
            self.render_base_config()
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.HtmlEditor({%s})' % base_config

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
        except Exception as msg:
            raise Exception(msg)
        
        base_config = self._get_config_str()
        return 'new Ext.form.DisplayField({%s})' % base_config