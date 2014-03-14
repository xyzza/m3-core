#coding: utf-8
"""
Хелперы для отработки расширяемых конфигураций url'ов
Created on 20.05.2010

@author: akvarats
"""

import inspect

import warnings

from django.conf import settings
from django.utils import importlib
from django.conf import urls

from m3.actions import ControllerCache


def _get_instance(obj):
    if inspect.isclass(obj):
        warnings.warn(
            message=(
                "Возможность использования классов экшнов/паков"
                " вместо экземпляров, будет ликвидирована!"
            ),
            category=FutureWarning,
            stacklevel=2,
        )
        return obj()
    return obj


def get_app_urlpatterns():
    '''
    Возвращает конфигурацию урлов, объявленных в app_meta приложений.

    Данная функция не проглатывает ошибки, а выбрасывает все наружу.
    Перехват исключительных ситуаций данной фунции необходимо осуществлять
    вручную в urls.py прикладных приложений
    '''
    url_patterns = urls.defaults.patterns('',)

    for app_name in settings.INSTALLED_APPS:
        try:
            module = importlib.import_module('.app_meta', app_name)
        except ImportError, err:
            # по идее, такая ошибка возникает в
            # случае, если у нас для
            # установленного приложения
            # нет модуля app_meta.py
            if err.args[0].find('No module named') == -1:
                raise
            continue
        proc = getattr(module, 'register_urlpatterns', None)
        if callable(proc):
            url_patterns += proc()

    return url_patterns


def get_pack(pack_name):
    '''
    Получает набор экшинов по имени
    '''
    pack = ControllerCache.find_pack(pack_name)
    return pack.__class__ if pack is not None else None


def get_pack_instance(pack_name):
    '''
    Получает экземпляр набора экшенов по имени из контроллеров
    '''
    return ControllerCache.find_pack(pack_name)


def get_action(action_name):
    '''
    Возвращает полный класс экшена, объявленного с указанным
    квалифицирующим именем.
    '''
    return ControllerCache.find_action(action_name)


def get_url(action):
    '''
    Возвращает абсолютный путь до
    '''
    if inspect.isclass(action) or isinstance(action, str):
        action = get_action(action)
    return action.get_absolute_url() if action is not None else None

get_acton_url = get_url


def get_pack_url(pack_name):
    '''
    Возвращает абсолютный путь для набора экшенов
    '''
    pack = ControllerCache.find_pack(pack_name)
    return pack.get_absolute_url() if pack is not None else None


def get_pack_by_url(url):
    '''
    Возвращает набор экшенов по переданному url
    '''
    raise RuntimeError("Don't use ever!")
