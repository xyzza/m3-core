#coding:utf-8
'''
Вспомогательные функции используемые в паках
'''
from django.db.models.query_utils import Q
from django.db import models, connection, transaction, IntegrityError

def create_search_filter(filter, fields):
    if filter != None:
        condition = None  
        for word in filter.split(' '):
            for field in fields:
                q = Q(**{field + '__icontains': word})
                if condition == None:
                    condition = q
                else:
                    condition = condition | q
        return condition

def apply_search_filter(query, filter, fields):
    '''
    Накладывает фильтр поиска на запрос. Вхождение каждого элемента фильтра ищется в заданных полях.
    @param query: Запрос
    @param filter: Строка фильтра
    @param fields: Список полей модели по которым будет поиск
    '''
    assert isinstance(fields, (list, tuple))
    condition = create_search_filter(filter, fields)
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

def fetch_search_tree(model, filter):
    '''
    Задолбался честно говоря писать комментарии!
    '''
    # Сначала тупо получаем все узлы подходящие по фильтру
    nodes = model.objects.filter(filter).select_related('parent')
    
    # Из каждого узла создаем полный путь до корня
    paths = []
    processed_nodes = set()
    for node in nodes:
        # Проверяем не входит ли наш узел в один из просчитанных путей
        if node in processed_nodes:
            continue

        path = [node]
        while node.parent:
            node = node.parent
            path.append(node)
            processed_nodes.add(node)
        # Первый элемент пути всегда корень
        path.reverse()
        paths.append(path)

    if len(paths) == 0:
        return []
    
    def create_one_tree(path):
        ''' Превращает путь в дерево с понимаемое ExtJS гридом '''
        tree = path[0]
        for i in range(1, len(path)):
            path[i - 1].children = [path[i]]
        return tree
    
    # Начальное дерево в удобоваримом для грида формате 
    tree = [create_one_tree(paths[0])]
    
    # Слияние путей в одно дерево
    def merge(sub_tree, path_slice):
        try:
            print path_slice
            index = sub_tree.index(path_slice[0])
        except ValueError:
            sub_tree.append( create_one_tree(path_slice) )
        else:
            merge(sub_tree[index].children, path_slice[1:])

    for path in paths[1:]:
        merge(tree, path)
    
    def set_grid_attributes(sub_tree):
        '''  Пробегает дерево и устанавливает узлам атрибуты expanded и leaf '''
        if not hasattr(sub_tree, 'children') or len(sub_tree.children) == 0:
            sub_tree.leaf = True
        else:
            sub_tree.expanded = True
            for st in sub_tree.children:
                set_grid_attributes(st)
    
    for sub_tree in tree:
        set_grid_attributes(sub_tree)
    
    return tree
    
    
    
    
            
            
    