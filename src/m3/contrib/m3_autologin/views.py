#coding:utf-8
'''
Created on 08.07.2011

@author: akvarats
'''

from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import login, logout, get_backends
from django.contrib.auth.models import User

from m3.contrib.m3_audit import AuditManager


from m3.helpers import logger

from api import get_autologin_config


URL_REDIRECT_ON_ERROR = '/'

def autologin_view(request, login_option):
    '''
    Обработчик автоматического входа в систему в систему с 
    '''
    
    autologin_config = get_autologin_config()
     
    username, url = autologin_config.get(login_option, [None,None])
    
    if not username:
        # пока вот так, редиректим просто на главную страницу
        logger.error(u'Не указано имя пользователя для варианта автоматического входа в систему %s.' % login_option)
        return HttpResponseRedirect(URL_REDIRECT_ON_ERROR)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        logger.error(u'Пользователя с именем %s не существует для варианта автоматического входа в систему %s.' % (username, login_option))
        return HttpResponseRedirect(URL_REDIRECT_ON_ERROR)
    
    if not user.is_active:
        logger.error(u'Пользователя с именем %s заблокирован и не может быть использован для варианта автоматического входа в систему %s.' % (username, login_option))
        return HttpResponseRedirect(URL_REDIRECT_ON_ERROR)
    
    auth_backends = get_backends()
    if auth_backends:
        user.backend = "%s.%s" % (auth_backends[0].__module__, 
                                  auth_backends[0].__class__.__name__)
    
    logout(request)
    login(request, user)
    
    # пишем запись в аудит входа
    AuditManager().write('auth', user=user)
    AuditManager().write('auto-login', user=user, type='no-password', request=request)
    
    
    return HttpResponseRedirect(url)