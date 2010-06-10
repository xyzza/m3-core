# -*- coding: utf-8 -*-

import logging.handlers
import os
import sys
import traceback
from django.http import HttpResponseServerError, HttpRequest
from django.template.loader import render_to_string

__all__ = ['init_logging', 'catch_error_500', 'info', 'error', 'debug', 'warning']

DEFAULT_LOGGING_PATH = 'd:\\_temp\\'

def init_logging(logs_path):
    '''
    Инициализация питоновского логирования. Срабатывает только один раз.
    Каждый error level записывается в свой лог.
    Нужно добавлять в settings.py или manage.py
    '''
    if hasattr(logging, "m3_set_up_done"):
        return
    
    if not os.path.exists(logs_path):
        os.mkdir(logs_path)
        
    loggers = [('root',         logging.NOTSET, 'root.log'),
               ('error_logger', logging.ERROR,  'error.log'),
               ('info_logger',  logging.INFO,   'info.log'),
               ('debug_logger',  logging.DEBUG,   'debug.log'),
               ('warning_logger',  logging.DEBUG,   'warning.log')]
    formatter = logging.Formatter("[%(asctime)s] %(message)s")
    formatter.datefmt = '%Y-%m-%d %H:%M:%S'
    for lname, level, fname in loggers:
        t = logging.getLogger(lname)
        t.setLevel(level)
        handler = logging.handlers.TimedRotatingFileHandler(\
                  os.path.join(logs_path, fname), when = 'D', encoding = 'utf-8')
        handler.setFormatter(formatter)
        t.addHandler(handler)
    
    logging.m3_set_up_done = True

def get_session_info(request):
    '''
    Возвращает строку для лога с информацией о запросе
    '''
    if (request == None) or (not isinstance(request, HttpRequest)):
        return ''
    # Адрес запроса
    result = 'URL: ' + request.get_full_path() + ' (' + request.method + ')'
    # Юзер
    user = request.user
    if user and user.is_authenticated():
        result += ' - ' + user.email + ', ' + user.get_full_name()
    return result + '. '

#====================== ФУНКЦИИ АНАЛОГИЧНЫЕ LOGGING =====================
# Если передать именованный аргумент request = ... , то к сообщению будет
# добавлена информация о запросе
#========================================================================

def info(msg, *args, **kwargs):
    log = logging.getLogger('info_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.info(msg)

def error(msg, *args, **kwargs):
    log = logging.getLogger('error_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.error(msg)

def debug(msg, *args, **kwargs):
    log = logging.getLogger('debug_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.debug(msg)

def exception(msg='', *args, **kwargs):
    log = logging.getLogger('error_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.error(msg)
    try:
        exceptionType, exceptionValue, exceptionTraceback = sys.exc_info()
        tb = traceback.format_exception(exceptionType, exceptionValue, exceptionTraceback)
        log.error(u''.join(tb))
    except:
        pass

def warning(msg, *args, **kwargs):
    log = logging.getLogger('warning_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.warning(msg)

def catch_error_500(request, *args, **kwargs):
    '''
    Функция для перехвата ошибок сервера в боевом режиме.
    Возвращает страницу 500 определенную пользователем. 
    '''
    exception(get_session_info(request), exc_info = True)
    return HttpResponseServerError(render_to_string("500.html"))
    