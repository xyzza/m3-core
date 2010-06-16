#coding:utf-8
'''
Хелперы, которые помогают формировать пользовательский интерфейс

Created on 11.06.2010

@author: akvarats
'''

from m3.core import json

def paginated_json_data(query, start = 0, limit = 25):
    try:
        total = query.count()
    except:
        total = 0
    if start > 0 and limit < 1:
        data = list(query[start:])
    elif start >= 0 and limit > 0:
        data = list(query[start: start + limit])
    else:
        data = list(query)
    return json.M3JSONEncoder().encode({'rows': data, 'total': total})

def grid_json_data(query):
    '''
    Выдает данные, упакованные в формате, пригодном для хаванья стором грида
    '''
    return json.M3JSONEncoder().encode({'rows': list(query)})