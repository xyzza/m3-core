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
    def __init__(self, url='', method='GET', *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js' 

        # здесь находится обработчик кнопки "Очистить"
        # рендерится не в своем окружении, то есть не self.clean_button.render_globals(), так как при этом не получит
        # доступ к объекту ExtDictSelectField
        self.template_globals = 'ext-script/ext-dict-select-field-handler.js'  
        
        self.ask_before_deleting=True
        
        handler = ExtConnection(url=url, method=method, parameters=dict(field_id=self.client_id))
        
        self.select_button = ExtButton(text=u'Выбрать',handler=handler)
        self.clean_button = ExtButton(text=u'Очистить')                                  
        
        self.init_component(*args, **kwargs)
        
        # После init_component, чтобы ask_before_deleting проициниализировалось
        self.clean_button.handler=self.render_globals()
        
    def render(self):
        return render_component(self)
    
    def t_render_select_button(self):
        return self.select_button.render()
    
    def t_render_clean_button(self):
        return self.clean_button.render()
    
    def set_buttons_icon(self, icon_select='', icon_clean=''):
        self.select_button.icon = icon_select
        self.clean_button.icon = icon_clean
        
    def set_buttons_text(self, text_select='', text_clean=''):
        self.select_button.text = text_select
        self.clean_button.text = text_clean