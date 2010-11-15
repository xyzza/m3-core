#coding:utf-8
'''
Created on 25.10.2010

@author: kir
'''
import os
import zipfile
import smtplib
import datetime

from django.conf import settings

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from m3.helpers import logger

#===============================================================================
# Просмотр логов и чтение логов 
#===============================================================================

def get_log_content(filename):
    '''
    Возвращает содержимое файла с именем filename из директрии для логов
    '''
    filepath = os.path.join(settings.MIS_LOG_PATH, filename)
    filedata = None
    try:
        f = open(filepath, 'rb')
        filedata = f.read()
    except:
        logger.exception(u'Ошибка при попытке чтения файла' + filepath)
        raise
    return filedata

def log_files_list(date = None, to_email = None):
    '''
    Возвращает список лог-файлов заданный в MIS_LOG_PATсистемы в виде [ключ, файл]. 
    Требует администраторские права.
    '''
    log_files = []
    path_to_logs = settings.MIS_LOG_PATH
    for file in os.listdir(path_to_logs):
        if date:
            if date in file:
                if os.path.isfile(os.path.join(path_to_logs, file)):
                    log_files.append(file)
        elif not date and len(file) < 12:
            if os.path.isfile(os.path.join(path_to_logs, file)):
                log_files.append(file)
    log_files = [[log_files.index(file), file] for file in log_files if file]
    return log_files

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
