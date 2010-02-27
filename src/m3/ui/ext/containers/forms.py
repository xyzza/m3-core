#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from base import BaseExtPanel
from m3.ui.ext import render_component

class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        
    def render(self):
        return render_component(self)
        