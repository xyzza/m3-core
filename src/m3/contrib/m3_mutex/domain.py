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
        
        self.name = '' # наименование (например, ФИО) владельца
        self.user_id = '' # уникальный идентификатор владельца
        self.host = '' # тачка, с которой был выставлен семафор
        self.session_id = '' # идентификатор сессии, в рамках которой
        # был установлен семафор
        
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
        
    def check_owner(self, owner):
        '''
        Возвращает True в случае, если указанный в параметрах owner совпадает
        с владельцем семафора
        '''
        return owner.session == self.session
        

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
    
    def dump(self):
        '''
        Возвращает кортеж из двух элементов для сохранения алгоритма
        автоматического освобождения семафоров в текстовом виде
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def restore(self, config):
        '''
        Читает информацию о конфигурации условий автаматического освобождения
        семафором из текстовой строки.
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
class TimeoutAutoRelease(object):
    '''
    Освобождение семафора на основании превышения времени ожидания.
    
    self.timeout указывается в целых секундах.
    '''
    
    DEFAULT_TIMEOUT = 300
    
    def __init__(self, timeout=TimeoutAutoRelease.DEFAULT_TIMEOUT):
        
        self._timeout = timeout
    
    def check(self, mutex):
        '''
        Метод проверки на возможность получения 
        '''
        delta = datetime.datetime.now() - mutex.captured_since
        return delta.seconds > self._timeout if self.timeout else TimeoutAutoRelease.DEFAULT_TIMEOUT
    
    def dump(self):
        ''' 
        '''
        return ('timeout', str(self.timeout if self.timeout else TimeoutAutoRelease.DEFAULT_TIMEOUT),)
    
    def restore(self, config):
        '''
        '''
        try:
            self.timeout = int(config)
        except ValueError:
            self.timeout = TimeoutAutoRelease.DEFAULT_TIMEOUT
            
                
#===============================================================================
# Вспомогательные классы
#===============================================================================
class MutexQuery(object):
    '''
    Класс, представляющий запрос на получение 
    информации
    '''
    def __init__(self, filter='', start=0, offset=-1):
        self.filter = filter
        self.start = start
        self.offset = offset