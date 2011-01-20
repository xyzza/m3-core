#coding: utf-8
'''
Общие хелперы 
'''

from uuid import uuid4


def normalize(str):
    '''
    Конвертирует строку в вид, понятный javascript'у
    '''
    return str.replace('\r','\\r').\
        replace('\n','\\n').\
        replace('\"','\\"').\
        replace("\'","\\'")


def generate_client_id():
    '''
    Генерирует уникальный id для визуального компонента.
    '''
    return 'cmp_' + str(uuid4())[0:8]


def get_img_size(src_size, dest_size):
    '''
    Возвращает размеры изображения в пропорции с оригиналом исходя из того,
    как направлено изображение (вертикально или горизонтально)
    '''
    width, height = dest_size
    src_width, src_height = src_size
    if height >= width:                     
        return (int(float(width)/height*src_height), src_height)                             
    return (src_width,  int(float(height)/width*src_width))


def generate_id():
    '''
    Генерирует восьмизначный random.
    Используется для id строки в локальных сторах заявки и корзины, чтобы
    избежать пересечения id-шников
    '''
    return str(uuid4())[0:8]