.. _app_meta_overview::
	
Описание файла app_meta.py
==========================

При старте сервера Django автоматически прогружает и инициализирует приложения указанные в `settings.INSTALLED_APPS <http://docs.djangoproject.com/en/dev/ref/settings/>`_. Регистрируются модели в models.py и адреса в urls.py.

Но приложениям построенным на базе М3 тоже нужна инициализация специфичных возможностей М3. Для этого в каждом приложении должен быть файл **app_meta.py**.  Как правило он содержит:

* Определение контроллера приложения и регистрацию экшенов. Смотри главу :ref:`actions_ActionController`
* Регистрацию адресов приложения без urls.py
* Регистрацию ярлыков рабочего стола и меню
* Регистрацию точек расширений

.. _app_meta_urls::

Регистрация адресов приложения
------------------------------

Пример::
	
    def register_urlpatterns():
    ''' Регистрация конфигурации урлов для приложения '''
    return urls.defaults.patterns('',
        (r'^er/$', 'mis.er.views.main_response'),
        (r'reception-to-doctor', 'mis.er.views.reception_to_doctor'),
        (r'reception-to-survey', 'mis.er.views.reception_to_survey'),
        (r'schedule', 'mis.er.views.schedule'),
        (r'get-ticket', 'mis.er.views.get_ticket'),
        (r'webservices/er', 'mis.er.views.webservice'),
        (r'webservices/er?wsdl', 'mis.er.views.webservice')       
    )

Как видно, определение ничем не отличается стандартного в Django. Но для того чтобы register_urlpatterns вызывался, в корневом urls.py нужно использовать специальный хелпер::
	
	from django.conf.urls.defaults import *
	from django.conf import settings
	
	# для чтения конфигурации урлов из подключаемых прикладных приложений
	from m3.helpers import urls
	
	urlpatterns = patterns('',
	    ...
	)
	
	# собираем шаблоны урлов из app_meta подключенных приложений
	urlpatterns += urls.get_app_urlpatterns()

.. autofunction:: m3.helpers.urls.get_app_urlpatterns

.. _app_meta_desktop::

Регистрация ярлыков рабочего стола
----------------------------------

Подробнее в главе :ref:`web_desktop_overview`.

Пример::
	
	def register_desktop_menu():
	    """ Добавление ярлыков в web desktop """
	    root = DesktopLaunchGroup(name=u'Справочники')
            common_registry = DesktopLaunchGroup(name=u'Единая регистратура')
            common_registry.subitems.extend([
            DesktopLauncher(
                name=u'Профили',
                url=get_list_win(Profiles_DictPack)),
            DesktopLauncher(
                name=u'Обследования',
                url=get_list_win(Observations_DictPack)),
            DesktopLauncher(
                name=u'Недействительные полисы',
                url=get_list_win(IneffectivePolicies_DictPack)),
                ...
            ])

            root.subitems.append(common_registry)
    
            INTERNAL_USER_METAROLE = metaroles.get_metarole('internal-user')
            DesktopLoader.add(INTERNAL_USER_METAROLE, DesktopLoader.START_MENU, root)
            DesktopLoader.add(INTERNAL_USER_METAROLE, DesktopLoader.TOPTOOLBAR, root)

Вызовы register_desktop_menu производятся из класса m3.ui.DesktopLoader, при первом обращении к рабочему столу из корневой вьюшки. Я разный проектах сборка ярлыков может отличаться.

            
.. _app_meta_extensions::

Регистрация точек расширений
----------------------------

Подробнее в главе :ref:`plugins_extension_points`.

На данный момент способ считается устаревшим! Пример::
	
	def register_extensions():
	    """ Регистрация точек расширений """
	    manager = plugins.ExtensionManager()
	    manager.append_listener(
	        'mis.poly.reg.doctor_journal_and_amb_ticket_journal',
                plugins.ExtensionListener(
                    er_ext.register_desktop_menu_off, 
                    call_type=plugins.ExtensionHandler.INSTEAD_OF_PARENT))
                    

