#!/usr/bin/env python
#coding:utf-8

import sys
import subprocess
import shlex
import uno
import time
from com.sun.star.connection import NoConnectException
from optparse import OptionParser

def start_server(port=8010):
    '''
    Запускает OpenOffice
    ''' 
    command = 'soffice -accept="socket,host=localhost,port=%d;urp;\
               StarOffice.ServiceManager" -norestore -nofirstwizard -nologo -headless' % port 
    args = shlex.split(command)
    try:
        subprocess.Popen(args)
        print 'Сервер успешно запущен на порту %s' %port
    except OSError as e:
        print "Не удалось запустить сервер на порту %d: %s. \
        Возможно, не установлен OpenOffice или не прописан путь в переменной окружения PATH" % (port, e.message)    
        
def stop_server(port=8010):
    '''
    Закрывает рабочую область OpenOffice
    '''     
    localContext = uno.getComponentContext()
    resolver = localContext.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", localContext)
    # Пытаемся соединиться с сервером
    try:
        context = resolver.resolve("uno:socket,host=localhost,port=%d;urp;StarOffice.ComponentContext" % port)
    except NoConnectException:
        print "Не удалось соединиться с сервером OpenOffice на порту %d" % port
        return    
    desktop = context.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", context)
    desktop.terminate()
    del desktop
    print "Сервер на порту %s остановлен." % port

if __name__ == '__main__':
    
    params_error_message = "Параметр %s недопустим. Используйте --help для помощи."
    
    parser = OptionParser()
    parser.add_option("-c", "--command", dest="command", help=u"Команда start для запуска, stop для остановки и restart для перезапуска сервера OpenOffice", type="string")
    parser.add_option("-p", "--port", dest="port", help=u"Порт сервера OpenOffice", type="int", default=8010)  
    (options, args) = parser.parse_args(sys.argv[1:])                    
    command = options.command
    port = options.port
    if command == 'start':
        start_server(port)
    elif command == 'stop':
        stop_server(port)
    elif command == 'restart':
        stop_server(port)
        start_server(port)
    else:
        raise ValueError, params_error_message %command