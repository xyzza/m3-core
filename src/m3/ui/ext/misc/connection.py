#coding:utf-8
'''
Created on 5.3.2010

@author: prefer
'''
from m3.ui.ext.base import ExtUIComponent

class ExtConnection(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(ExtConnection, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-connection.js'
        self.url = ''
        self.method = None
        self.parameters = {}
        self.function_success = None
        self.function_failure = None
        self.init_component(*args, **kwargs)