# coding: utf-8
'''
Created on 29.03.2011

@author: prefer
'''

import os
import subprocess
from optparse import make_option

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    '''
    Позволяет запускать сервер дизайнера командой manage.py runide
    В INSTALLED_APPS приложения должно быть m3.Scontrib.designer
    '''

    # Подсказка        
    help = u'Запускает сервер для дизайнера'

    # Список опции для запуска
    option_list = BaseCommand.option_list + (
        make_option('--port',            
            dest='port',
            default=7777,
            help=u'Порт для запуска сервера дизайнера'),
        )

    def handle(self, *args, **options):
        '''
        Обработчик запуска команды: python manage.py <<command>>
        '''
        
        # Устанавливаем в переменную среды путь до проекта, откуда запущена runide
        os.putenv('PROJECT_FOR_DESIGNER', os.path.abspath(os.path.curdir))
        
        self.stdout.write('M3 Designer IDE starting... \n')
        
        # Путь до сервера дизайнера
        cwd = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))                
                       
        popen = subprocess.Popen(
                    'python manage.py runserver ' + str(options['port']),
                    shell = True,
                    cwd = cwd)

        popen.wait()