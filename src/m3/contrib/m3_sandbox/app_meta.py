#coding: utf-8
from m3.contrib.m3_sandbox import SandboxKeeper
from django.conf import urls as django_urls
from m3.ui.actions import ActionController
from m3.ui.app_ui import DesktopShortcut, DesktopLoader, DesktopLauncher
from m3.contrib.m3_users.app_meta import ADMIN
from m3.contrib.m3_users import metaroles

import actions
import views

__author__ = 'ZIgi'

ui_controller = ActionController('sandbox_ui')
ui_controller.packs.extend([actions.AccountsManagementPack, actions.SelectDjangoUserPack])

class RedirectShortcut(DesktopLauncher):
    '''
    Значок, который по клике редиректит на урл. Для того чтобы он заработал,
    нужно  поменять рендеринг хэндлера в workspace.html(может быть не во всех проектах есть такая проблема,
    но суть в том функция хендлера прописана в темлейте, а не в классе значка)
    '''
    def __init__(self, *args, **kwargs):
        super(RedirectShortcut, self).__init__(*args,**kwargs)
        self.handler = 'function() { document.location.href = "%s" }' % self.url


def register_actions():
    pass

def register_urlpatterns():
    controllers = SandboxKeeper.get_sandbox_controllers()
    urls = django_urls.defaults.patterns('', ('^sandbox_ui/',
                                              lambda request:ui_controller.process_request(request)))
    
    for k,v in controllers.items():
        urls += django_urls.defaults.patterns('', ('^sandbox/' + k + '/',
                                              lambda request: v.process_request(request)))

    urls += django_urls.defaults.patterns('', ('^foo/', views.test))
    

    return urls

def register_desktop_menu():
    #TODO прикрутить что-то с метаролями - нужна некая метароль некоего разработчика
    admin_user = metaroles.get_metarole(ADMIN)
    accounts_shortcut = DesktopShortcut(name = u'Учетные записи', icon='guests',
                                        pack = actions.AccountsManagementPack )
    DesktopLoader.add(admin_user, DesktopLoader.DESKTOP, accounts_shortcut)

    DesktopLoader.add(admin_user, DesktopLoader.DESKTOP, RedirectShortcut(name = u'GTFO', icon = 'face',
                                                                          url = 'http://www.google.com'))