#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField
from m3.ui.ext import render_component

class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render(self):
        js = 'id: "%s"' % self.client_id
        js += '' if not self.name else ',name: "%s"' % self.name
        js += '' if not self.label else ',fieldLabel: "%s"' % self.label
        js += '' if not self.value else ',value: "%s"' % self.value
        js += '' if not self.width else ',width: "%s"' % self.width
        return 'new Ext.form.TextField({%s})' % js

        
class ExtDateField(ExtStringField):
    '''
    Поле ввода даты
    '''
    def __init__(self, *args, **kwargs):
        super(ExtDateField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render(self):
        js = 'id: "%s"' % self.client_id
        js += '' if not self.name else ',name: "%s"' % self.name
        js += '' if not self.label else ',fieldLabel: "%s"' % self.label
        js += '' if not self.value else ',value: "%s"' % self.value
        js += '' if not self.width else ',width: "%s"' % self.width
        return 'new Ext.form.DateField({%s})' % js
    
class ExtNumberField(ExtStringField):
    '''
    Поле ввода числового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtNumberField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render(self):
        js = 'id: "%s"' % self.client_id
        js += '' if not self.name else ',name: "%s"' % self.name
        js += '' if not self.label else ',fieldLabel: "%s"' % self.label
        js += '' if not self.value else ',value: "%s"' % self.value
        js += '' if not self.width else ',width: "%s"' % self.width
        return 'new Ext.form.NumberField({%s})' % js  
    
class ExtComboBox(ExtStringField):
    '''
    Поле комбобокс
    '''
    def __init__(self, *args, **kwargs):
        super(ExtComboBox, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-combo.js'
        self.display_field = ''
        self.store = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def set_store(self, store):
        self.store = store