#coding:utf-8
'''
Created on 16.01.2011

@author: akvarats
'''
import datetime

from django.conf import settings
from django.contrib import auth

from m3.helpers import logger


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