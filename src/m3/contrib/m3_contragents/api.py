#coding:utf-8
'''
Created on 08.02.2011

@author: akvarats
'''

from m3.helpers import validation

#===============================================================================
# Контрагент - юридическое лицо
#===============================================================================

class BaseContragentProxy(object):
    '''
    Базовый класс прокси объекта контрагента
    '''
    
    def __init__(self, *args, **kwargs):
        self.clear()
        
    def clear(self):
        '''
        Приводит состояние объекта в первоначальное состояние.
        
        Данную функцию необходимо переопределять в дочерних классах классе
        '''
        self.id = None
        
    def validate(self):
        '''
        Выполняет проверку данных контрагента перед заполнением
        '''
        pass
    
    
    def load(self, contragent_id):
        '''
        Выполняет заполнение объекта на основе переданных данных
        '''
        pass
    
    def save(self):
        '''
        Выполняет сохранение данных контрагента
        '''
        pass

class UContragentProxy(BaseContragentProxy):
    '''
    Прокси-объект, который за работу с контрагентом, как с юридическим лицом
    '''        
        
    def clean(self):
        '''
        Очистка состояния объекта контрагента-юридического лица
        '''
        super(UContragentProxy, self).clear()
        
        self.short_name = '' 
        self.full_name = ''
        self.inn = ''
        self.kpp = ''
    
class FContragentProxy(BaseContragentProxy):
    '''
    Прокси-объект для контрагента-физического лица
    '''
    
    def clear(self):
        '''
        Очистка состояния объекта контрагента-юридического лица
        '''
        super(FContragentProxy, self).clear()
        
        self.fname = ''
        self.iname = ''
        self.oname = ''
        
        self.inn = ''
        self.snils = ''