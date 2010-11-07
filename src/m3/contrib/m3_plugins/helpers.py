#coding:utf-8
'''
Created on 23.09.2010

@author: akvarats
'''

import os

from ConfigParser import ConfigParser

from django.conf import settings
from m3.helpers import logger
from domain import Plugin

PLUGINS_CONF = 'plugins.conf'
PLUGINS_SECTION = 'plugins'
ACTIVATED_PLUGINS_OPTION = 'ACTIVATED_PLUGINS'

def get_project_root():
    '''
    Возвращяет путь до корневой папки проекта
    '''
    if hasattr(settings, 'M3_PROJECT_ROOT'):
        return settings.M3_PROJECT_ROOT
    if hasattr(settings, 'PROJECT_ROOT'):
        return settings.PROJECT_ROOT
    return './'

def get_plugins_root():
    '''
    Пытаемся понять, где могут располагаться плагины к нашей информационной
    системе.
    '''
    # сначала пытаемся понять, заданы ли явно пути к расположению плагинов
    # либо пути к расположению
    if hasattr(settings, 'M3_PLUGINS_ROOT'):
        return settings.M3_PLUGINS_ROOT
    if hasattr(settings, 'M3_PROJECT_ROOT'):
        return os.path.join(settings.M3_PROJECT_ROOT, 'plugins')
    if hasattr(settings, 'PROJECT_ROOT'):
        return os.path.join(settings.PROJECT_ROOT, 'plugins')
    
    # если явного расположения плагина не задано, и непонятен рутовый каталог
    # нашего проекта, то считаем, что текущий каталог и есть рутовая папка проекта.
    return os.path.join('./', 'plugins')

def get_plugins_from_settings():
    '''
    Возвращает список имен плагинов, полученный
    из settings.py
    '''
    # по идее, метод нужный. но сейчас из settings.py невозможно понять
    # какие плангины перечислены в параметре PLUGINS конкретного
    # прикладного приложения.
    # Поэтому, рекомендуется получать список возможных плагинов
    # пробежкой по settings.INSTALLED_APPS.
    
#    plugins_string = ''
#    if hasattr(settings,'M3_PLUGINS'):
#        plugins_string = settings.M3_PLUGINS
#    elif hasattr(settings,'PLUGINS'):
#        plugins_string = settings.PLUGINS
#    return [plugin.strip() for plugin in plugins_string.split(',') if plugin.strip()] 
    
    raise NotImplementedError()
        

def get_installed_plugins():
    '''
    Возвращает список установленных плагинов. Список плагинов читается
    из переменной plugins_folder
    '''
    result = []
    plugins_root = get_plugins_root()
    if os.path.exists(plugins_root):
        subfolders = os.listdir(plugins_root)
        for plugin_folder in subfolders:
            plugin_full_path = os.path.join(plugins_root, plugin_folder)
            try:
                plugin = Plugin()
                plugin.load_info(plugin_full_path)
                result.append(plugin)
            except:
                logger.exception(u'Не удалось загрузить плагин из папки' + ' "' + plugin_full_path + '"')
    return result

def mark_activated_plugins(plugins):
    '''
    Помечает активированные плагины из списка plugins
    '''
    for plugin in plugins:
        plugin.activated = plugin.name in settings.INSTALLED_APPS
    return plugins

def get_activated_plugins():
    '''
    Возвращаяет список активированныз плагинов
    '''
    result = []
    installed_plugins = get_installed_plugins()
    
    for plugin in installed_plugins:
        if plugin.name in settings.INSTALLED_APPS:
            result.append(plugin)
    return result

def check_plugin_exists(plugin_name):
    '''
    Проверяет наличие плагина с указанным именем
    '''
    plugin_path = os.path.join(get_plugins_root(), plugin_name)
    return os.path.exists(os.path.join(plugin_path, '__init__.py'))

def get_plugin_by_name(plugin_name):
    '''
    Возвращает объект плагина по его наименованию. Если такого плагина не существует,
    то возвращается False.
    '''
    if not check_plugin_exists(plugin_name):
        return None
    plugin_path = os.path.join(get_plugins_root(), plugin_name)
    plugin = Plugin()
    plugin.load_info(plugin_path)
    return plugin


def activate_plugin(plugin_name):
    '''
    Активирует плагин с указанным именем.
    '''
    try:
        if plugin_name not in [plugin.name for plugin in get_installed_plugins()]:
            # плагин не установлен. всякий шлак в plugins.conf НЕ ПИШЕМ
            return
        
        parser = ConfigParser()
        plugins_conf_path = os.path.join(get_project_root(), PLUGINS_CONF)
        
        if os.path.exists(plugins_conf_path):
            parser.read(plugins_conf_path)
        
        # читаем список плагинов из plugins.conf    
        plugins_string = parser.get(PLUGINS_SECTION, ACTIVATED_PLUGINS_OPTION, '').strip()
        plugin_names = []
        if plugins_string.strip():
            plugin_names = plugins_string.strip().split(',')
        
        if not plugin_name in plugin_names:
            plugin_names.append(plugin_name)
        
        if not parser.has_section(PLUGINS_SECTION):
            parser.add_section(PLUGINS_SECTION)
        parser.set(PLUGINS_SECTION, ACTIVATED_PLUGINS_OPTION, ','.join(plugin_names))
        
        fp = open(plugins_conf_path, 'w')
        parser.write(fp)
        fp.close()
    except:
        logger.exception(u'Не удалось активировать плагин ' + plugin_name)
        raise
        
def deactivate_plugin(plugin_name):
    '''
    Деактивирует плагин из системы
    '''
    try:    
        parser = ConfigParser()
        plugins_conf_path = os.path.join(get_project_root(), PLUGINS_CONF)
        
        if not os.path.exists(plugins_conf_path):
            return
        
        parser.read(plugins_conf_path)
        plugins_string = parser.get(PLUGINS_SECTION, ACTIVATED_PLUGINS_OPTION, '').strip()
        plugin_names = []
        if plugins_string.strip():
            plugin_names = plugins_string.strip().split(',')
        if plugin_name in plugin_names:
            plugin_names.remove(plugin_name)
            
        if not parser.has_section(PLUGINS_SECTION):
            parser.add_section(PLUGINS_SECTION)
        parser.set(PLUGINS_SECTION, ACTIVATED_PLUGINS_OPTION, ','.join(plugin_names))
        
        fp = open(plugins_conf_path, 'w')
        parser.write(fp)
        fp.close()
    except:
        logger.exception(u'Не удалось деактивировать плагин ' + str(plugin_name))
        raise        
        
def install_plugin(plugin_distr_filepath):
    
    try:
        raise NotImplementedError(u'Функция установки плагина')
    except:
        logger.exception(u'Не удалось установить плагин из пакета ' + str(plugin_distr_filepath))
        
def remove_plugin(plugin_name):
    '''
    Безвозвратно удаляет плагин из системы (с удалением всех его исходных кодов)
    '''
    try:
        pass
    except:
        pass