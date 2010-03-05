#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField

class ExtStringField(BaseExtField):
    '''
    Поле ввода простого текстового значения
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)
        self.init_component(*args, **kwargs)
        
    def render(self):
#        js = 'new Ext.form.TextField({'
#        if self.name:
#            js += 'name:"' + self.name + '",'
#        if self.label:
#            js += 'fieldLabel:"' + self.label + '",'
#        if self.value:
#            js += 'value:"' + self.value + '",'
#        if self.width:
#            js += 'width:' + self.width + ','
#        return js + 'id:"' + self.client_id + '"})'
        js = 'id: "%s"' % self.client_id
        js += '' if not self.name else ',name: "%s"' % self.name
        js += '' if not self.label else ',fieldLabel: "%s"' % self.label
        js += '' if not self.value else ',value: "%s"' % self.value
        js += '' if not self.width else ',width: "%s"' % self.width
        return 'new Ext.form.TextField({%s})' % js

        
class ExtDateField(BaseExtField):
    '''
    Поле ввода даты
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStringField, self).__init__(*args, **kwargs)