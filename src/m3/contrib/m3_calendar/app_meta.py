#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''

from django.conf import urls as django_urls

from controller import calendar_controller
from actions import ExceptedDay_DictPack

def register_actions():
    calendar_controller.packs.extend([ExceptedDay_DictPack,])

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения
    '''
    return django_urls.defaults.patterns('',
        (r'^m3-calendar/', calendar_view)
    )
    
    
def calendar_view(request):
    '''
    '''
    return calendar_controller.process_request(request)