# -*- coding: utf-8 -*-

import logging.handlers
import os
import sys
import traceback

from django.conf import settings

from django.http import HttpResponseServerError, HttpRequest
from django.template.loader import render_to_string
from django.core.mail import get_connection
from django.core.mail.message import EmailMessage
from django.utils.html import linebreaks

__all__ = ['init_logging', 'catch_error_500', 'info', 'error', 'debug', 'warning']

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
    if hasattr(request, 'user'):
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
    
    # Отправка на почту
    send_mail_log(msg, 'ERROR')

def debug(msg, *args, **kwargs):
    '''
    Выводит информацию в debug-log только в случае включенного режима отладки
    '''
    if settings.DEBUG:
        log = logging.getLogger('debug_logger')
        msg = get_session_info(kwargs.get('request', None)) + msg
        log.debug(msg)    

def exception(msg='', recursion=0,  *args, **kwargs):
    #Не желаемые ключи логирования
    donot_parse_keys = ['win','request']
    
    log = logging.getLogger('error_logger')
    msg = get_session_info(kwargs.get('request', None)) + 'Message: ' + msg + '\n'

    # FIXME: Отрефаторить нахер!!
    try:
        e_type, e_value, e_traceback = sys.exc_info()
        e_vars = e_traceback.tb_frame.f_locals
        res = ['Variables:\n']
        
        if e_traceback.tb_frame.f_code.co_name != '<module>':
            for key, val in e_vars.items():
                if key in donot_parse_keys:
                    continue
                
                res.append('%s: %s\n'.rjust(6)%(key,val))
                if hasattr(val , '__dict__'):
                    for obj_item_key, obj_item_val in val.__dict__.items():
                        if obj_item_key[0] !='_':
                            res.append('%s: %s\n'.rjust(12)%(obj_item_key, obj_item_val))
        else:
            res = []

        e_vars_str = ''.join(res)
        tb = traceback.format_exception(e_type, e_value, e_traceback)
        
        err_message = '\n %s %s %s' % (msg, u''.join(tb), e_vars_str)
        log.error(err_message)      
        
        # Отправка на почту
        send_mail_log(err_message)
      
    except:        
        if recursion<10:
            log.exception('\n Ошибка внутри логгера!', recursion+1)
        else:
            log.error('\n Некоррертная работа логера')
            

def warning(msg, *args, **kwargs):
    log = logging.getLogger('warning_logger')
    msg = get_session_info(kwargs.get('request', None)) + msg
    log.warning(msg)
    
    send_mail_log(msg, 'WARN')

def catch_error_500(request, *args, **kwargs):
    '''
    Функция для перехвата ошибок сервера в боевом режиме.
    Возвращает страницу 500 определенную пользователем. 
    '''
    exception(get_session_info(request), exc_info = True)
    return HttpResponseServerError(render_to_string("500.html"))
    
    
#===============================================================================
def send_mail_log(msg, level=''):
    '''
    Дополнительное письмо с логом на почту администратора
    '''

    if hasattr(settings, 'EMAIL_ERRORLOG_ADMIN') and getattr(settings, 'EMAIL_ERRORLOG_ADMIN') \
        and  hasattr(settings, 'EMAIL_ADDRESS_FROM') and getattr(settings, 'EMAIL_ADDRESS_FROM'):

        emails_admin = getattr(settings, 'EMAIL_ERRORLOG_ADMIN')
        if isinstance(emails_admin, list):
            email_list = [emails_admin,]            
        elif isinstance(emails_admin, basestring):
            email_list = emails_admin.split(',')        
            
        email_from = getattr(settings, 'EMAIL_ADDRESS_FROM')
        
        conn = get_connection(auth_user = settings.EMAIL_HOST_USER,
                      auth_password= settings.EMAIL_HOST_PASSWORD)
        
        
        uname = os.uname()
        msg = linebreaks(msg)
        d = {'body': msg, 'from_email': email_from, 'to': email_list,
             'subject': 'Логер - %s - %s' % (uname[1], level,)}
        message = EmailMessage(**d)
        message.content_subtype = "html"
        conn.send_messages([message,])
        