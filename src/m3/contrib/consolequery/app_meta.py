#coding:utf-8
'''
Created on 14.12.2010

@author: Камилла
'''
from django.conf import urls

from m3.ui.actions import ActionController
from m3.contrib.consolequery  import actions
from django.conf import settings

from m3.ui.app_ui import DesktopLaunchGroup, DesktopLoader, DesktopLauncher
from m3.contrib.m3_users.metaroles import get_metarole

m3_consolequery_controller = ActionController('/m3-consolequery')

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения
    '''
    return urls.defaults.patterns('',
        (r'^m3-consolequery/', 'm3.contrib.consolequery.app_meta.controller'),
    )

#@authenticated_user_required
def controller(request):

    return m3_consolequery_controller.process_request(request)

def register_desktop_menu():
    '''
    Регистрирует отдельные элементы в меню "Пуск"
    '''
    ADMIN_METAROLE = get_metarole('admin')
    
    #===========================================================================
    # Пункты меню в администрировании
    #===========================================================================

    try:
        if settings.DATABASES['readonly']:
            admin_root = DesktopLaunchGroup(name = u'Администрирование', icon='menu-dicts-16')
            admin_root.subitems.append(DesktopLauncher(name = u'Консоль запросов', url=actions.QyeryConsoleWinAction.absolute_url()))
            
            DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.START_MENU, admin_root)
            DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.TOPTOOLBAR, admin_root)  
    except:
        None  

def register_actions():
    '''
    Метод регистрации Action'ов для приложения в котором описан
    '''
    m3_consolequery_controller.packs.extend([
        actions.QueryConsoleActionsPack,
        actions.CustomQueries_DictPack
    ])