#coding:utf-8

import subprocess
import shlex

def start_server(port=8010, headless_mode=True):
    '''
    Запускает сервер OpenOffice.
    ''' 
    command = 'soffice -accept="socket,host=localhost,port=%d;urp;\
               StarOffice.ServiceManager" -norestore -nofirstwizard -nologo' % port            
    args = shlex.split(command)
    if headless_mode:
        args.append('-headless')
    try:
        subprocess.Popen(args)
        print 'Сервер OpenOffice успешно запущен на порту %s' %port
    except OSError as e:
        print "Не удалось запустить сервер Openoffice на порту %d: %s. \
        Возможно, не установлен OpenOffice или не прописан путь в переменной окружения PATH" % (port, e.message)    
