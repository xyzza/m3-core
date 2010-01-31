#coding: utf-8
'''
Хелперы для удобного чтения конфигурационного файла проекта

@author: akvarats
'''

import ConfigParser

class ProjectConfig:
    '''
    Обертка над парсером параметров конфигурации
    '''
    def __init__(self, filenames=[], defaults={}):
        self.parser = ConfigParser.ConfigParser()
        if filenames:
            self.parser.read(filenames)
        self.defauls = defaults
        
    def read(self, filenames):
        '''
        Загружает конфигурацию из файла(ов) filenames
        '''
        self.parser = ConfigParser()
        self.parser.read(filenames)
    
    def set_defaults(self, defaults):
        '''
        Устанавливает параметры проекта по умолчанию
        '''
        self.defauls = defaults
    
    def get(self, section, option):
        '''
        Безопастно возвращает значение конфигурационного параметра option
        из раздела section
        '''
        try:
            value = self.parser.get(section, option).strip()
            if not value:
                return self.defauls[(section,option)]
            return value
        except:
            if self.defauls.has_key((section,option)):
                return self.defauls[(section,option)]
        return ''