#coding: utf-8
import os
from django.conf.urls.defaults import url
from django.core.urlresolvers import reverse
from m3.contrib.designer.ide.views import designer
from m3.contrib.m3_sandbox import SandboxKeeper
from django.conf import urls as django_urls, settings
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


    urls += django_urls.defaults.patterns('',
        url('^m3-ide/$', views.workspace, name = 'ide-workspace'),
        # статичный контент проекта
        (r'^ide-static/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': os.path.join( settings.M3_ROOT, 'contrib/designer/static' ) }),


        # Файлы проекта
        (r'^m3-ide/project-files$', 'm3.contrib.designer.ide.views.get_project_files'),

        # Создание нового класса в файле
        (r'^create-new-class$', 'm3.contrib.designer.ide.views.create_class'),

        # Создание функции инициализации в классе
        (r'^create-autogen-function$', 'm3.contrib.designer.ide.views.create_initialize'),

        # Создание контейнерной функции
        (r'^create-function$', 'm3.contrib.designer.ide.views.create_cont_func_view'),

        # Возвращает по питоновскому кода, js код
        (r'^designer/upload-code$', 'm3.contrib.designer.ide.views.upload_code'),
        (r'^designer/data$','m3.contrib.designer.ide.views.designer_data'),
        (r'designer/save$','m3.contrib.designer.ide.views.designer_save'),
        (r'designer/preview$','m3.contrib.designer.ide.views.designer_preview'),
        (r'designer/file-content$','m3.contrib.designer.ide.views.designer_file_content'),
        (r'designer/file-content/save$','m3.contrib.designer.ide.views.designer_file_content_save'),
        (r'designer/project-manipulation$','m3.contrib.designer.ide.views.designer_structure_manipulation'),
        (r'designer/project-global-template$','m3.contrib.designer.ide.views.designer_global_template_content'),
        (r'designer/codeassist$','m3.contrib.designer.ide.views.codeassist')
    )

    return urls

def register_desktop_menu():
    #TODO прикрутить что-то с метаролями - нужна некая метароль некоего разработчика и некая роль админа разработчиков
    admin_user = metaroles.get_metarole(ADMIN)
    accounts_shortcut = DesktopShortcut(name = u'Разработчики', icon='devs',
                                        pack = actions.AccountsManagementPack )
    DesktopLoader.add(admin_user, DesktopLoader.DESKTOP, accounts_shortcut)
    DesktopLoader.add(admin_user, DesktopLoader.DESKTOP, RedirectShortcut(name = u'Дизайнер', icon = 'engineer',
                                                                          url = reverse('ide-workspace')))