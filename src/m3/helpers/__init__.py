#coding: utf-8
'''
Общие хелперы 
'''

from uuid import uuid4


def normalize(str):
    '''
    Конвертирует строку в вид, понятный javascript'у
    '''
    #assert issubclass(str, basestring) -- Бывают еще файлы
    return str.replace('\r','\\r').replace('\n','\\n')


def generate_client_id():
    '''
    Генерирует уникальный id для визуального компонента.
    '''
    return 'cmp_' + str(uuid4())[0:8]