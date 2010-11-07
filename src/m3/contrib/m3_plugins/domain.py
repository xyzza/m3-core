#coding:utf-8
'''
Модуль с классами бизнес-уровня


Created on 23.09.2010

@author: akvarats
'''
import os

from django.utils.importlib import import_module


class Plugin:
    '''
    Описывает плагин
    '''
    
    _DEFAULT_DESCRIPTION = ''
    _DEFAULT_VERSION = (0,0,0)
    _DEFAULT_DEPENDENCIES = (('system', (0, 0, 0)))
    
    def __init__(self):
        self.name = ''
        self.description = Plugin._DEFAULT_DESCRIPTION
        self.version = Plugin._DEFAULT_VERSION
        self.dependencies = Plugin._DEFAULT_DEPENDENCIES
    
    def verbose_version(self):
        return str(self.version[0]) + '.' + str(self.version[1]) + '.' + str(self.version[2])
     
    verbose_version.json_encode = True
    
    def ui_status(self):
        if hasattr(self, 'activated'):
            return 'включен' if self.activated else '-'
        
    ui_status.json_encode = True
    
    def load_info(self, location):
        '''
        Загружает информацию о плагине. В параметре location необходимо передавать полный путь
        до папки хранения исходных текстов плагина (т.е. до файла __init__.py
        '''
        if not os.path.exists(os.path.join(location,'__init__.py')):
            raise Exception(u'Путь ' + str(location) + u' не соответствует папке хранения плагина')
        # __init__.py каждого плагина должен быть написан таким образом, чтобы его
        # можно было бы проимпортировать в любой момент независимо от остального приложения
        # поэтому перехват исключительных ситуаций не предусмотрен
        module = import_module('.__init__', os.path.basename(location))
        
        self.name = os.path.basename(location)
        self.description = getattr(module, 'DESCRIPTION', Plugin._DEFAULT_DESCRIPTION)
        self.version = getattr(module, 'VERSION', Plugin._DEFAULT_VERSION)
        self.dependencies = getattr(module, 'DEPENDS_ON', Plugin._DEFAULT_DEPENDENCIES)