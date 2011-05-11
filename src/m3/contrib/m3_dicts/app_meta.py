#coding:utf-8

from django.conf import urls as django_urls

from m3.contrib.m3_users.metaroles import get_metarole
from m3.ui.actions import ActionController
from m3.ui.app_ui import DesktopLaunchGroup, DesktopLoader, DesktopShortcut

from actions import DulType_DictPack

m3_dicts_controller = ActionController('/m3-dicts')

def register_actions():
    '''
    Метод регистрации Action'ов для приложения в котором описан
    '''
    m3_dicts_controller.packs.extend([DulType_DictPack])

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения
    '''
    return django_urls.defaults.patterns('',(r'^m3-dicts/', m3_dicts_view) )

def register_desktop_menu():
    '''Регистрирует пункт меню в "Администрировании"'''
    ADMIN_METAROLE = get_metarole('admin')

    admin_root = DesktopLaunchGroup(name = u'Администрирование')
    admin_root.subitems.append(
        DesktopShortcut(name = u'Документы, удостоверяющие личность',
                        pack = DulType_DictPack)
    )

    DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.START_MENU, admin_root)
    DesktopLoader.add(ADMIN_METAROLE, DesktopLoader.TOPTOOLBAR, admin_root)


def m3_dicts_view(request):
    return m3_dicts_controller.process_request(request)