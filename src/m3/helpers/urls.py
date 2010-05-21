#coding: utf-8
'''
Хелперы для отработки расширяемых конфигураций url'ов
Created on 20.05.2010

@author: akvarats
'''

from django.conf import settings
from django.utils import importlib
from django.conf import urls

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
        except ImportError:
            # по идее, такая ошибка возникает в случае, если у нас для установленного приложения
            # нет модуля app_meta.py
            continue
        proc = getattr(module, 'register_urlpatterns', None)
        if callable(proc):
            url_patterns += proc()
            
    return url_patterns
    
