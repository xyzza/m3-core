#coding:utf-8
'''
Created on 11.02.2011

@author: akvarats
'''

class ContragentDoesNotExist(Exception):
    '''
    Исключительная ситуация, генерируемая при невозможности
    считать объект контрагента из базы данных
    '''
    pass

class SaveContragentException(Exception):
    '''
    Исключительная ситуация, которая выбрасывается при 
    попытке неудачного сохранения объекта контрагента
    '''
    pass

class WrongContragentTypeException(Exception):
    '''
    Исключительная ситуация, которая выбрасывается при попытке использовать
    в системе
    '''
    pass