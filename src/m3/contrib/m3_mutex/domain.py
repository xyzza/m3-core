#coding:utf-8
'''
Created on 14.07.2011

@author: akvarats
'''

import datetime

from django.utils.translation import ugettext as _

class MutexID(object):
    '''
    Инкапсуляция над идентификатором экземпляра семафора
    '''
    def __init__(self, group, cls, id):
        self.group = group
        self.cls = cls
        self.id = id

class MutexOwner(object):
    '''
    Инкапсуляция над владельцем семафора
    '''
    def __init__(self, name = '', login = '', host = ''):
        self.name = ''
        self.login = ''
        self.host = ''
        
class SystemOwner(MutexOwner):
    '''
    Владелец, представленный в виде системного процесса
    '''    
    def __init__(self):
        super(SystemOwner, self).__init__(name='system', login='', host='server')
        
        


class Mutex(object):
    '''
    Класс семафора
    '''
    def __init__(self, id, owner):
        self.id = id
        self.owner = owner
        self.captured_since = datetime.datetime.min() 
        

class AutoReleaseCondition(object):
    '''
    Базовый класс, устанавливающий правила автоматического освобождения (снятия)
    семафора.
    
    Данный механизм необходим для того, чтобы семафоры не оставались в 
    системе "навсегда".
    '''
    
    def check(self, mutex):
        '''
        Основной метод, который возвращает True в случае, если 
        указанный данный семафор может быть освобожден в автоматическом
        режиме
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
class TimeoutAutoRelease(object):
    '''
    Освобождение семафора на основании превышения времени ожидания.
    
    self.timeout указывается в целых секундах.
    '''
    def __init__(self, timeout=300):
        
        self._timeout = timeout
    
    def check(self, mutex):
        
        delta = datetime.datetime.now() - mutex.captured_since
        
        return delta.seconds > self._timeout
    
class 