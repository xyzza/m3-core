#coding:utf-8

import subprocess
import shlex
from m3.helpers import logger

def start_server(host='localhost', port=8010, headless_mode=True):
    '''
    Запускает сервер OpenOffice.
    ''' 
    command = 'soffice --accept="socket,host=%s,port=%d;urp;\
               StarOffice.Service" --norestore --nofirstwizard --nologo' % (host, port)            
    args = shlex.split(command)
    if headless_mode:
        args.append('--headless')
    try:
        subprocess.Popen(args)
        logger.info(u"Сервер OpenOffice успешно запущен на порту %s" %port)
    except OSError as e:
        logger.exception("Не удалось запустить сервер Openoffice на порту %d: %s. \
        Возможно, не установлен OpenOffice или не прописан путь в переменной окружения PATH" % (port, e.message))    
