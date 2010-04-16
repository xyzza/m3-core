#coding:utf-8
'''
Вспомогательные функции используемые в паках
'''
from django.db.models.query_utils import Q

def apply_search_filter(query, filter, fields):
    '''
    Накладывает фильтр поиска на запрос. Вхождение каждого элемента фильтра ищется в заданных полях.
    @param query: Запрос
    @param filter: Строка фильтра
    @param fields: Список полей модели по которым будет поиск
    '''
    assert isinstance(fields, (list, tuple))
    if filter != None:
        for word in filter.split(' '):
            condition = None
            for field in fields:
                q = Q(**{field + '__icontains': word})
                if condition == None:
                    condition = q
                else:
                    condition = condition | q
            if condition != None:
                query = query.filter(condition)
    return query
