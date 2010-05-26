#coding: utf-8
'''
Общие хелперы 
'''

def normalize(str):
    '''
    Конвертирует строку в вид, понятный javascript'у
    '''
    #assert issubclass(str, basestring) -- Бывают еще файлы
    return str.replace('\r','\\r').replace('\n','\\n')