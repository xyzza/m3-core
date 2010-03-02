#coding:utf-8
'''
Пакет для классов, отвечающих за отрисовку конечных клиентских javascript'ов
'''

from m3.ui.ext.base import ExtUIScriptRenderer
from m3.ui.ext import render_template

class ExtWindowRenderer(ExtUIScriptRenderer):
    '''
    Рендерер для скрипта на показ окна
    '''
    def __init__(self):
        self.template = 'ext-script/ext-windowscript.js'
        self.window = None
        
    def get_script(self):
        return render_template(self.template, {'renderer': self, 'window': self.window})