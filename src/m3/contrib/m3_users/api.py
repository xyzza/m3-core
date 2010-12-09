#coding:utf-8
'''
Внешнее API для подсистемы m3_users

Created on 09.12.2010

@author: akvarats
'''

from helpers import get_assigned_metaroles_query
from metaroles import get_metarole

def get_user_metaroles(user):
    '''
    Возвращает объекты метаролей, которые есть у пользователя.
    '''
    result = []
    for metarole_code in get_assigned_metaroles_query(user):
        metarole = get_metarole(metarole_code)
        if metarole:
            result.append(metarole)
    
    return result