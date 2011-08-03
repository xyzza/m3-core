#coding:utf-8
'''
Created on 25.10.2010

@author: kir
'''
import os
import zipfile
import smtplib
import datetime
import codecs
import time

from django.conf import settings

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from m3.helpers import logger

#===============================================================================
# Просмотр логов и чтение логов 
#===============================================================================

#===============================================================================
# - Константы
#===============================================================================

# Имена файлов участвующих в разборе(парсинге)
INFO = u'info.log'
ERROR = u'error.log'

# Длина Datetime формата (2010-11-17 14:01:58)
FULL_DATE_LENGHT = 20

# Максимальная длина ошибки в python
MAX_ERROR_LENGHT = 25

# Позиция в списке после даты и времени [2010-11-25 10:19:13]
POSITION_AFTER_DATE_TIME = 2

# Версия
VERSION = 'Версия'

def get_log_content(filename):
    '''
    Возвращает содержимое файла с именем filename из директории для логов
    '''
    filepath = os.path.join(settings.LOG_PATH, filename)
    filedata = None
    try:
        log_file = codecs.open(filepath, 'rb', 'utf-8')
        filedata = log_file_parse(log_file)
    except:
        logger.exception(u'Ошибка при попытке чтения файла' + filepath)
        raise
    return filedata

def log_files_list(start_date_str = None, end_date_str = None, to_email = None):
    '''
    Возвращает список лог-файлов заданный в MIS_LOG_PATсистемы в виде [ключ, файл]. 
    Требует администраторские права.
    '''
    log_files = []
    today = datetime.date.today()
    path_to_logs = settings.LOG_PATH
    for file_item in os.listdir(path_to_logs):
        full_path = os.path.join(path_to_logs, file_item)
        creation_date = file_creation_time(full_path)
        if file_creation_time(full_path).date() != today\
            and start_date_str and end_date_str:
            start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
            end_date = datetime.datetime.strptime(end_date_str,'%Y-%m-%d')
            if creation_date >= start_date and creation_date <= end_date:
                if os.path.isfile(os.path.join(path_to_logs, file_item)):
                    log_files.append(file_item)
        elif file_creation_time(full_path).date() == today:
            if os.path.isfile(os.path.join(path_to_logs, file_item)):
                log_files.append(file_item)
    log_files = [[log_files.index(file_item), file_item] for file_item in log_files if file_item]
    return log_files

def file_creation_time(full_path):
    '''
    Функция получения даты и времени создания файла
    '''
    # Время создания файла
    # st_ctime, st_mtime - зависит от операционной системы: 
    # для юниксов содержит дату последнего изменения метаданных, 
    # а для виндов - дату создания файла
    creation_time = os.stat(full_path).st_mtime
    # Переводим в локальное время
    year, month, day,\
    hour, min, sec, wday, yday, isdst = time.localtime(creation_time)
    creation_date = datetime.datetime(year, month, day)
    return creation_date

def log_file_parse(log_file):
    '''
    Функция парсинга файлов логирования
    Возвращает список из словарей. 
    .log [{date: ..., message:...}]
    '''
    file_name = os.path.basename(log_file.name)
    if file_name == INFO:
        info_lines = []
        for line in log_file.xreadlines():
            if line[0] == '[': #and VERSION in line:
                info_lines.append(
                {'date': line[1:FULL_DATE_LENGHT],
                'message':' '.join(line.split()[POSITION_AFTER_DATE_TIME:])})
        #Более новые записи в начало
        info_lines.reverse()
        return info_lines or []
    elif ERROR in file_name:
        error_lines = []
        full_error_text = []
        message_list = []
        message_dict = {}
        for line in log_file.xreadlines():
            if line[0] == '[':
                # Точка входа, каждый блок парсинга имеет дату заключенную в []
                if message_dict:
                    message_dict['full'] = "".join(full_error_text[:])
                    message_dict['message'] = "; ".join(message_list[:])
                    error_lines.append(message_dict.copy())
                    message_dict.clear()
                    full_error_text = []
                    message_list = []
                message_dict['date'] = line[1:FULL_DATE_LENGHT]
            elif 'Message:' in line:
                message_list.append(" ".join(line.split()[1:]))
            elif 'Error:' in line[:MAX_ERROR_LENGHT]:
                message_list.append(line)
            elif 'DoesNotExist:' in line:
                message_list.append(line)
            full_error_text.append(line)
        # Записывает последние данные в буфере.
        if message_dict:
            message_dict['full'] = "".join(full_error_text[:])
            message_dict['message'] = "; ".join(message_list[:])
            error_lines.append(message_dict.copy())
        #Более новые записи в начало
        error_lines.reverse()
        return error_lines or []
    return []

# ( Не удалять )Данный кусок кода, предназначен для реализации отправки письма 
# с заархивированным лог файлом

#def log_files_to_zip(file_name_list):
#    ''' Упаковывает лог файлы в архив '''
#    os.chdir(settings.MIS_LOG_PATH)
#    zip_file = zipfile.ZipFile(str(datetime.date.today())+'.zip', "w")
#    zip_file.write(file for file in file_name_list if file)
#    zip_file.close()

#def zipped_log_files_to_email():
#    ''' Отправляет zip файл с логами на email'''
#    me = "my@email.com"
#    you = "your@email.com"
#    
#    # Create message container - the correct MIME type is multipart/alternative.
#    msg = MIMEMultipart('alternative')
#    msg['Subject'] = "Link"
#    msg['From'] = me
#    msg['To'] = you
#    
#    # Create the body of the message (a plain-text and an HTML version).
#    text = "Hi!\nHow are you?\nHere is the link you wanted:\nhttp://www.python.org"
#    html = """\
#    <html>
#      <head></head>
#      <body>
#        <p>Hi!<br>
#           How are you?<br>
#           Here is the <a href="http://www.python.org">link</a> you wanted.
#        </p>
#      </body>
#    </html>
#    """
#    
#    # Record the MIME types of both parts - text/plain and text/html.
#    part1 = MIMEText(text, 'plain')
#    part2 = MIMEText(html, 'html')
#    
#    # Attach parts into message container.
#    # According to RFC 2046, the last part of a multipart message, in this case
#    # the HTML message, is best and preferred.
#    msg.attach(part1)
#    msg.attach(part2)
#    
#    # Send the message via local SMTP server.
#    s = smtplib.SMTP('localhost')
#    # sendmail function takes 3 arguments: sender's address, recipient's address
#    # and message to send - here it is sent as one string.
#    s.sendmail(me, you, msg.as_string())
#    s.quit()
