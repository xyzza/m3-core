#coding:utf-8
'''
Created on 16.01.2011

@author: akvarats
'''
import datetime

try:
    from threading import local
except ImportError:
    from django.utils._threading_local import local
    
_thread_locals = local()

from django.conf import settings
from django.contrib import auth

from m3.helpers import logger

class M3CommonMiddleware(object):
    '''
    Middleware общего назначения для проектов на M3.
    
    Данное middleware должно располагаться ниже
    SessionMiddleware и AuthenticationMiddleware
    '''
    def process_request(self, request):
        '''
        Обработчик, срабатывающий перед выполнением запроса в прикладном 
        приложении. Записываем в thread-locals информацию о 
        текущей сессии и пользователе.
        '''
        user = auth.get_user(request)
        
        _thread_locals.m3_user_id = user.id if user else ''
        _thread_locals.m3_user_login = user.username if user else ''
        
        _thread_locals.m3_session_key = request.session.session_key
        
    def _clear(self):
        '''
        Очищает информацию в thread-locals о текущей сессии и пользователе
        '''
        if hasattr(_thread_locals, 'm3_user'):
            del _thread_locals.m3_user
            
        if hasattr(_thread_locals, 'm3_session_key'):
            del _thread_locals.m3_session_key
            
    def process_response(self, request, response):
        self.clear()
        return response
    
    def process_exception(self, request, exception):
        self.clear()
        

class M3SimpleProfileMiddleware(object):
    """
    Выводит в отладочный лог время отработки задного запроса вместе с полным адресом 
    """
    def process_request(self, request):
        request.m3_simple_profile_start_time = datetime.datetime.now()
        
    def process_response(self, request, response):
        try:
            logger.debug(str(datetime.datetime.now() - request.m3_simple_profile_start_time) + ' ' + request.get_full_path())
        except:
            pass
                    
        return response
    
    
class AutoLogout(object):
    '''
    Отслеживает активность пользователей в системе.
    Если с последнего действия пользователя прошло времени больше чем INACTIVE_SESSION_LIFETIME,
    то он выводит пользователя из системы
    '''
    
    session_key = 'app_last_user_activity_time'
    
    def process_request(self, request):
        # Если проверка отключена
        if settings.INACTIVE_SESSION_LIFETIME == 0:
            return
        
        # У аутентифицированного пользователя проверяем таймаут, а ананимусов сразу посылаем
        if request.user.is_authenticated():
            last_time = request.session.get(self.session_key, None)
            if last_time != None:
                delta = datetime.datetime.now() - last_time
                if delta.seconds / 60 > settings.INACTIVE_SESSION_LIFETIME:
                    # После логаута сессия уже другая и присваивать время не нужно
                    auth.logout(request)
                    return
                    
            # Записываем время последнего запроса
            request.session[self.session_key] = datetime.datetime.now()