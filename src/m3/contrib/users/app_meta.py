#coding:utf-8
'''
Created on 10.06.2010

@author: akvarats
'''

from django.conf import urls

from m3.ui.actions import ActionController


from roles import RolesActions
from users import UsersActions

users_controller = ActionController(url='/m3-users')

def register_actions():
    users_controller.packs.extend([
        RolesActions,
        UsersActions,
    ])

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения m3.contrib.users
    '''
    return urls.defaults.patterns('',
        (r'^m3-users', 'm3.contrib.users.app_meta.users_view'),
    )
        
#===============================================================================
# Представления
#===============================================================================
def users_view(request):
    return users_controller.process_request(request) 