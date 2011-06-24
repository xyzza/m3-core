#coding:utf-8 
'''
Date&Time: 01.06.11 10:38
@author: kir
'''

from django.conf import urls

from m3.ui.actions import ActionController
from m3.ui.app_ui import DesktopLaunchGroup, DesktopLoader, \
    DesktopShortcut
from m3.contrib.m3_users.metaroles import get_metarole

import actions

m3_query_builder_controller = ActionController('/m3-query-builder')

def m3_query_builder_view(request):
    '''
    '''
    return m3_query_builder_controller.process_request(request)

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения
    '''
    return urls.defaults.patterns('',
        (r'^m3-query-builder/', m3_query_builder_view),
    )

def register_desktop_menu():
    '''
    Регистрирует отдельные элементы в меню "Пуск"
    '''
    ADMIN_METAROLE = get_metarole('admin')
    
    admin_root = DesktopLaunchGroup(name = u'Администрирование', icon='menu-dicts-16')
    admin_root.subitems.append(
        DesktopShortcut(name = u'Редактор запросов',
                        pack= actions.QueryBuilderActionsPack,
                        icon='icon-database-gear')
    )

    admin_root.subitems.append(
        DesktopShortcut(name = u'Редактор отчетов',
                        pack= actions.ReportBuilderActionsPack,
                        icon='icon-database-gear')
    )

    DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.START_MENU, admin_root)
    DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.TOPTOOLBAR, admin_root)

def register_actions():
    '''
    Метод регистрации Action'ов для приложения в котором описан
    '''
    m3_query_builder_controller.packs.extend([
        actions.QueryBuilderActionsPack,
        actions.ReportBuilderActionsPack,
    ])