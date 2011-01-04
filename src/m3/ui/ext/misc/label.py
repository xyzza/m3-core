#coding:utf-8
'''
Created on 23.3.2010

@author: prefer
'''

from m3.ui.ext.base import ExtUIComponent

#===============================================================================  
class ExtLabel(ExtUIComponent):
    '''
    Произвольный текст
    
    @version: 0.1
    @begin_designer
    {title: "Label"
    ,ext_class: "Ext.form.Label"
    ,xtype: "label"
    ,attr: [{
        ext_attr: "text"
        ,py_attr: "text" 
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtLabel, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-label.js'
        self.text = None
        self.init_component(*args, **kwargs)
        
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass