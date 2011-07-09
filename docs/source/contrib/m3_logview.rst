.. _m3_logview:

Просмотр логов (m3_logview)
==============================

Общие сведения
--------------

Приложение ``m3.contrib.m3_logview`` предоставляет возможность просмотра логов в
графическом представлении.

На данный момент реализована возможность просмотра лог файлов (info, error, debug),
фильтрация по дате создания лог файла,

.. image:: /images/contrib/m3_logview.png

Подключение
--------------
Для подключения необходимо:

Добавить в ``settings.py`` -> INSTALLED_APPS -> ``'m3.contrib.logview',``

добавить import
``from m3.contrib.logview.actions import LogsAction as m3_logs_action``

Пример использования в панели(TOPTOOLBAR), пункт меню в администрировании

``admin_root.subitems.append(DesktopLauncher(name = u'Система логирования', url=m3_logs_action.absolute_url()))``