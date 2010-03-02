#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.fields.base import BaseExtField
from base import BaseExtPanel
from m3.ui.ext import render_component

class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        
    def render(self):
        return render_component(self)
    
    def render_items(self):
        js = ''
        for item in self.items:
            js += (item.render() + ',')
            
        if js and js[-1] == ',':
            js = js[0:len(js)-1]
        return js
    
    def _get_fields(self):
        result = []
        for item in self.items:
            if issubclass(item, BaseExtField):
                result.append(item)
        return result

    fields = property(_get_fields)