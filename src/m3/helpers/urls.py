#coding: utf-8
'''
Хелперы для отработки расширяемых конфигураций url'ов
Created on 20.05.2010

@author: akvarats
'''

import collections
import inspect

from django.conf import settings
from django.utils import importlib
from django.conf import urls

from m3.data import caching
from m3.ui import actions
from shortcuts import get_instance


import logger
from m3.ui.actions import ControllerCache

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
            # по идее, такая ошибка возникает в случае, если у нас для установленного приложения
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
    pack_data = PacksNameCache().get(pack_name, None)
    return pack_data[0] if pack_data else None

def get_pack_instance(pack_name):
    '''
    Получает экземпляр набора экшенов по имени из контроллеров
    '''
    pack_data = PacksNameCache().get(pack_name, None)
    return pack_data[2] if pack_data else None

def get_action(action_name):
    '''
    Возвращает полный класс экшена, объявленного с указанным
    квалифицирующим именем.
    '''
    action_data = ActionsNameCache().get(action_name, None)
    return action_data[0] if action_data else None


def get_url(action):
    '''
    Возвращает абсолютный путь до 
    '''
    names = []
    if isinstance(action, actions.Action):
        # гениальных ход! - с чем пришли, то и ищем :)
        names.append(action.get_absolute_url())
    elif inspect.isclass(action) and issubclass(action, actions.Action):
        names.append("%s.%s" % (action.__module__, action.__name__))
    elif isinstance(action, str):
        names.append(action)
    
    action_data = None
    for name in names:
        action_data = ActionsNameCache().get(name, None)
        if action_data:
            break
    return action_data[1] if action_data else ''

get_acton_url = get_url

def get_pack_url(pack_name):
    '''
    Возвращает абсолютный путь для набора экшенов 
    '''
    pack_data = PacksNameCache().get(pack_name, None)
    return pack_data[1] if pack_data else ''

def get_pack_by_url(url):
    '''
    Возвращает набор экшенов по переданному url 
    '''
    ControllerCache.populate()
    packs = collections.deque([])
    for controller in ControllerCache.get_controllers():
        packs.extend(controller.top_level_packs)

    while len(packs) > 0:
        pack = packs.popleft()
        if hasattr(pack, 'subpacks'):
            packs.extend(pack.subpacks)

        cleaned_pack = get_instance(pack)
        if url == cleaned_pack.__class__.absolute_url():
            return cleaned_pack
    return None
#===============================================================================
# Кеш, используемый для хранения соответствия экшенов
#===============================================================================
class ActionsNameCache(caching.IntegralRuntimeCache):
    '''
    Кеш, используемый для хранения соответствия имен экшенов и паков 
    соответствующим пакам
    '''

    def handler(self, cache, dimentions):
        '''
        Хендлер сборки кеша
        '''
        try:
            return inner_name_cache_handler(True)
        except:
            logger.exception(u'Cannot run handler of ActionsNameCache.')

        return {}

class PacksNameCache(caching.IntegralRuntimeCache):
    '''
    Кеш, используемый для хранения соответствия имен экшенов и паков 
    соответствующим пакам
    '''

    def handler(self, cache, dimentions):
        '''
        Хендлер сборки кеша
        '''
        try:
            return inner_name_cache_handler(False)
        except:
            logger.exception(u'Cannot run handler of ActionsNameCache.')

        return {}

def inner_name_cache_handler(for_actions=True):
    '''
    Внутренний метод обхода дерева паков и экшенов.
    Используется в хендлерах сборки кешей
    
    '''
    def get_shortname(obj):
        '''
        Возвращает короткое имя для экшена или пака. 
        Сам объект экшена или пака передается в параметре
        obj.
        '''
        names = ['shortname', 'short_name', ]
        objects = [obj.__class__, obj]
        for o in objects:
            for name in names:
                if hasattr(o, name) and isinstance(getattr(o, name), str):
                    return getattr(o, name, '')

        return ''

    # TODO посмотреть как работает для врапнутых классов
    result = {}

    ControllerCache.populate()
    # что-то внутренность данного метода не вызывает
    # доверия, если честно

    packs = collections.deque([])

    controllers = actions.ControllerCache.get_controllers()

    # считываем паки верхнего уровня
    for controller in controllers:
        packs.extend(controller.top_level_packs)

    while len(packs) > 0:
        pack = packs.popleft()
        # субпаки - в очередь!
        if hasattr(pack, 'subpacks'):
            packs.extend(pack.subpacks)
        if for_actions and hasattr(pack, 'actions'):
            for action in pack.actions:
                
                # если имеем дело с экземпляром экшена, то ключем будет его полный url 
                if isinstance(action, actions.Action):
                    url = action.get_absolute_url()
                    key = url
                    result[key] = (action.__class__, url, action)
                
                # неважно что нам передали, нам нужен экземпляр класса
                cleaned_action = get_instance(action)

                key = cleaned_action.__class__.__module__ + '.' + cleaned_action.__class__.__name__
                url = cleaned_action.__class__.absolute_url()
                result[key] = (cleaned_action.__class__, url, cleaned_action)

                shortname = get_shortname(cleaned_action)
                if shortname:
                    result[shortname] = (cleaned_action.__class__, url, cleaned_action)
                    
        else:
            cleaned_pack = get_instance(pack)
            key = cleaned_pack.__class__.__module__ + '.' + cleaned_pack.__class__.__name__
            url = cleaned_pack.__class__.absolute_url()
            result[key] = (cleaned_pack.__class__, url, cleaned_pack)
            shortname = get_shortname(cleaned_pack)
            if shortname:
                result[shortname] = (cleaned_pack.__class__, url, cleaned_pack)

    return result
