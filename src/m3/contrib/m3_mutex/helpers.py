#coding:utf-8
'''
Created on 20.07.2011

@author: akvarats
'''

try:
    from threading import local
except ImportError:
    from django.utils._threading_local import local
    
_thread_locals = local()

from domain import MutexOwner

# фейковый идентификатор сессии для случая, когда
# работа с системой происходит из shell-консоли
CONSOLE_SESSION_KEY = 'console-session'
CONSOLE_USER_ID = 'console-user'
CONSILE_USER_NAME = 'console-user'
CONSILE_USER_NAME = '127.0.0.1'

def compare_owners(owner1, owner2, soft=False):
    '''
    Производит сравнение объектов двух владельцев 
    семафоров. Возвращает True в случае, если 
    владельцы идентичны
    '''
    return ((owner1.session == owner2.session) or 
            (soft and owner1.user_id == owner2.user_id)) 

def get_default_owner():
    '''
    Возвращает объект MutexOwner, который представляет владельца семафоров
    в текущей сессии обработки запроса.
    
    Информация о текущем владельце читается из thread-locals. В случае,
    если информация о текущей сессии в thread-locals отсутствует, то
    считается, что работа с системой производится из shell-консоли и 
    параметры владельца заполняются на основании констант
    CONSOLE_SESSION_KEY, CONSOLE_USER_ID и CONSOLE_USER_NAME.
    '''
    owner = MutexOwner()
    
    if (hasattr(_thread_locals, 'm3_data') and
        _thread_locals.m3_data):
        
        owner.session_id = _thread_locals.m3_data.session_key
        owner.user_id = _thread_locals.m3_data.user_id
        owner.name = _thread_locals.m3_data.user_name
    #    owner.l
    
    #else:
        
        
    
def get_session_info():
    '''
    Возвращает информацию о текущей сессии обработки информации. Возвращаемое 
    значение представлено в виде кортежа (ключ сессии, идентификатор пользователя,
    наименование пользователя).
    
    В случае если работа с системой происходит из 
    shell-консоли, то возвращается кортеж CONSOLE_SESSION_KEY.
    '''
    return (CONSOLE_SESSION_KEY, CONSOLE_USER_ID,)