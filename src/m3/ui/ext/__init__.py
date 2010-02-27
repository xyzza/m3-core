#coding:utf-8

from uuid import uuid4

#from windows import ExtWindow
from django.template import Context
from django.template.loader import get_template

class ExtUIComponent(object):
    '''
    Базовый класс для всех компонентов пользовательского интерфейса
    '''
    def __init__(self, *args, **kwargs):
        self.template = ''
        self.client_id = 'cmp_' + str(uuid4())[0:8]
    
    def render(self):
        return ''
    
def render_component(component):
    context = Context({'component': component})
    template = get_template(component.template)
    return template.render(context)
    