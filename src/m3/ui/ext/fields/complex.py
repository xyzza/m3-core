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
    def __init__(self, url='', 
                 icon_select='', 
                 icon_clean='',
                 text_select = '',
                 text_clean = '',
                 *args, 
                 **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js' 

        # здесь находится обработчик кнопки очистить
        # рендерится не в своем окружении, то есть не self.clean_button.render_globals(), так как при этом не получит
        # доступ к объекту ExtDictSelectField
        self.template_globals = 'ext-script/ext-dict-select-field-handler.js'  
        
        handler = ExtConnection(url=url, 
                                method='GET',
                                parameters=dict(field_id=self.client_id))
        
        self.select_button = ExtButton(text = text_select,
                                       handler = handler, 
                                       icon = icon_select)
        
        self.clean_button = ExtButton(text = text_clean,
                                      icon = icon_clean,
                                      handler=self.render_globals())
                                      
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_select_button(self):
        return self.select_button.render()
    
    def render_clean_button(self):
        return self.clean_button.render()