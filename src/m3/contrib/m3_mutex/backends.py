#coding:utf-8
'''
Created on 15.07.2011

@author: akvarats
'''

from django.utils.translation import ugettext as _

class BaseMutexBackend(object):
    '''
    Базовый класс (интерфейс) бекэнда для управления семафорами.
    '''
    
    def capture_mutex(self, mutex_id, owner, auto_release):
        '''
        Метод захвата семафора
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def release_mutex(self, mutex_id, owner):
        '''
        Метод освобождения семафора
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def request_mutex(self, mutex_id):
        '''
        Метод проверки состояния семафора
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    
class ModelMutexBackend(BaseMutexBackend):
    pass

class SessionMutexBackend(BaseMutexBackend):
    pass 