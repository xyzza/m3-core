#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtField
from m3.ui.ext import render_component
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtConnection

class ExtDictSelectField(BaseExtField):
    '''
    Поле с выбором из справочника
    '''
    def __init__(self, url='',*args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js' 
        
        handler = ExtConnection(url=url, 
                                method='GET',
                                parameters=dict(field_id=self.client_id))
        
        self.select_button = ExtButton(text = u'Выбрать',handler=handler)
        self.clean_button = ExtButton(text = 'Очистить', handler='function(){Ext.getCmp("%s").setValue('')}' % self.client_id)
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_select_button(self):
        return self.select_button.render()
    
    def render_clean_button(self):
        return self.clean_button.render()