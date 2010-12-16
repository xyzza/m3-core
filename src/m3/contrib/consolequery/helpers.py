#coding:utf-8
'''
Created on 14.12.2010

@author: Камилла
'''

from django.db import connections
from django.db import transaction 
from m3.contrib.consolequery.models import CustomQueries


@transaction.commit_manually
def query_result_list(sql):
    """
    Выполняет полученный запрос sql
    Возращает: в случае удачного выполнения результат запроса и пустую ошибку
                в случае неудачи пустой результат запроса и ошибку 
    
    """
    try:
        cursor = connections['readonly'].cursor() 
        cursor.execute(sql)
    except Exception, e:
        transaction.rollback()
        return None, e.args[0], None
    else:
        transaction.commit()
        return cursor.fetchall(), None, cursor.description
        
def new_query_save(name, sql):
    sql  = transform_query(sql)
    if CustomQueries.objects.filter(name=name):
        old_query = CustomQueries.objects.get(name=name)
        old_query.query = sql
        old_query.save()
    else:
        nqs = CustomQueries(name = name, query = sql)
        nqs.save()
        return None
  
def transform_query(sql):
    dict_sym = {1:'\n',2:' ',3:'=',4:'>',5:'<'}
    dict_lit = {1:'%0A',2:'%20',3:'%3D',4:'%3E',5:'%3C'} 
    i = 1
    for l in dict_sym:
        sql = sql.replace(dict_lit[i],dict_sym[i])
        i = i + 1
    return sql

def load_query(query_id,arg):
    '''
    Запрашивает запрос из модели по query_id
    '''
    query_text = CustomQueries.objects.get(id=query_id)
    if arg == False:
        return query_text.query
    else:
        return query_text.name