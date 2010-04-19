#coding:utf-8
'''
Вспомогательные функции используемые в паках
'''
from django.db.models.query_utils import Q
from django.db import models, connection, transaction, IntegrityError

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


def bind_object_from_request_to_form(request, obj_factory, form):
    '''
    Функция извлекает объект из запроса по id, создает его экземпляр и биндит к форме
    @param request:     Запрос от клиента содержащий id объекта
    @param obj_factory: Функция возвращающая объект по его id
    @param form:        Класс формы к которому привязывается объект
    '''
    # Получаем объект по id
    id = request.REQUEST.get('id')
    obj = obj_factory(id)
    # Разница между новым и созданным объектов в том, что у нового нет id или он пустой
    create_new = True
    if isinstance(obj, dict) and obj.get('id') != None:
        create_new = False
    elif hasattr(obj, 'id') and getattr(obj, 'id') != None:
        create_new = False
    # Устанавливаем параметры формы
    win = form(create_new = create_new)
    # Биндим объект к форме
    win.form.from_object(obj)
    return win

def bind_request_form_to_object(request, obj_factory, form):
    '''
    Функция создает объект по id в запросе и заполняет его атрибуты из данных пришедшей формы
    @param request:     Запрос от клиента содержащий id объекта
    @param obj_factory: Функция возвращающая объект по его id
    @param form:        Класс формы к которому привязывается объект
    '''
    # Создаем форму для биндинга к ней
    win = form()
    win.form.bind_to_request(request)
    # Получаем наш объект по id
    id = request.REQUEST.get('id')
    obj = obj_factory(id)
    # Биндим форму к объекту
    win.form.to_object(obj)
    return obj

def safe_delete_record(model, id):
    '''
    Безопасное удаление записи в базе. В отличие от джанговского ORM не удаляет каскадно.
    Возвращает True в случае успеха, иначе False 
    '''
    assert issubclass(model, models.Model)
    assert isinstance(id, int)
    try:
        cursor = connection.cursor()
        sql = "DELETE FROM %s WHERE id = %s" % (model._meta.db_table, id)
        cursor.execute(sql)
        transaction.commit_unless_managed()
    except IntegrityError:
        return False
    
    return True