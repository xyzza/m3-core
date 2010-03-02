#coding:utf-8
'''
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3.ui.ext

Created on 01.03.2010

@author: akvarats
'''
from uuid import uuid4

from django import template as django_template


class ExtUIScriptRenderer(object):
    '''
    Класс, отвечающий за рендер файла скрипта, который
    будет отправлен клиенту. 
    '''
    def __init__(self):
        # шаблон, в который осуществляется вывод содержимого
        # скрипта
        self.template = 'ext-script/ext-ui-script.js'
        # компонент, содержимое которого выводится в шаблон
        self.component = None
    
    def render(self):
        result = ''
        try:
            result = self.component.render()
        except AttributeError:
            result = ''
        return result
    
    def render_globals(self):
        result = ''
        try:
            result = self.component.render_globals()
        except AttributeError:
            result = ''
        return result 
        
    def get_script(self):
        context = django_template.Context({'renderer': self})
        template = django_template.loader.get_template(self.template)
        return template.render(context) 
    
#===============================================================================
# Базовый класс для компонентов пользовательского интерфейса
#===============================================================================
class ExtUIComponent(object):
    '''
    Базовый класс для всех компонентов пользовательского интерфейса
    '''
    def __init__(self, *args, **kwargs):
        self.template = ''
        self.client_id = 'cmp_' + str(uuid4())[0:8]
        # рендерер, используемый для вывода соответствующего компонента
        self.renderer = ExtUIScriptRenderer()
    
    def render(self):
        '''
        Возвращает "кусок" javascript кода, который используется для
        отображения самого компонента. За рендер полного javascript
        отвечает метод get_script()
        '''
        return ''
    
    def get_script(self):
        return self.renderer.get_script()