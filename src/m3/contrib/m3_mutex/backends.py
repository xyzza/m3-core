#coding:utf-8
'''
Created on 15.07.2011

@author: akvarats
'''

from django.utils.translation import ugettext as _

from domain import MutexOwner, TimeoutAutoRelease 
from models import Mutex
from helpers import compare_owners
from exceptions import MutexBusy

class BaseMutexBackend(object):
    '''
    Базовый класс (интерфейс) бекэнда для управления семафорами.
    '''
    
    def capture_mutex(self, mutex, owner=None, auto_release=TimeoutAutoRelease()):
        '''
        Метод захвата семафора.
        
        @param mutex_id: либо объект класса domain.Mutex, либо domain.MutexID
        @param owner: объект класса domain.MutexOwner, который представляет 
            владельца семафора. Если передать значение None, то будет
            использованы значения из thread-locals
        @param auto_release: правило автоосвобождения данного семаформа. По 
            умолчанию используется автоматическое освобождение по таймауту
            в 5 минут.
        '''
        
        if not owner:
            owner = MutexOwner()
            # здесь читаем параметры 
            
        
        mutex = self._read_mutex(mutex_id)
        if mutex:
            if not compare_owners(mutex.owner, owner):
                raise MutexBusy()
            # семафор был ранее захвачен нами, обновляем информацию
            # об его захвате
            self._refresh_mutex(mutex)
        else:
            mutex = Mutex()
            self._add_mutex(mutex)
        
    
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
    
    def _read_mutex(self, mutex_id):
        '''
        Внутренний метод чтения информации о семафоре из хранилища
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def _add_mutex(self, mutex):
        '''
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def _refresh_mutex(self, mutex):
        '''
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
    
    def remove_mutex(self, mutex):
        '''
        @param mutex: объект класса domain.Mutex, который необходимо
        удалить из хранилища семафоров. 
        '''
        raise NotImplementedError(_(u'Данный метод должен быть переопределен в классах-потомках'))
        
    
class ModelMutexBackend(BaseMutexBackend):
    '''
    Бекэнд, который реализует хранение семафоров в базе данных
    '''
    pass
    
class SessionMutexBackend(BaseMutexBackend):
    '''
    Бекэнд, который реализует хранение семафоров в сессии
    текущей обработки запросов.
    
    Данный бекэнд необходимо использовать для выставления семафоров
    только в рамках обработки текущего запроса.
    '''
    pass 