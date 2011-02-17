#coding:utf-8
'''
Created on 08.02.2011

@author: akvarats
'''

from django.conf import urls as django_urls

from controller import contragents_controller
from actions import ContragentActionPack

def register_actions():
    '''
    '''
    contragents_controller.packs.extend([ContragentActionPack,])


def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения
    '''
    return django_urls.defaults.patterns('',
        (r'^m3-contragents/', contragents_view)
    )
    
    
def contragents_view(request):
    '''
    '''
    return contragents_controller.process_request(request)