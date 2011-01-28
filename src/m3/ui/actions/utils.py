#coding:utf-8
'''
Вспомогательные функции используемые в паках
'''
import json

from django.db.models.query_utils import Q
from django.db import models, connection, transaction, IntegrityError
from m3.helpers import logger

def apply_sort_order(query, columns, sort_order):
    '''
    Закладывает на запрос порядок сортировки. Сначала если в описании колонок columns есть code, 
    то сортируем по нему, иначе если есть по name. Если задан sort_order, то он главнее всех.
    '''
    if isinstance(sort_order, list):
        query = query.order_by(*sort_order)
    else:
        order = None
        for column in columns:
            if isinstance(column, tuple):
                if column[0] == 'name':
                    order = 'name'
                elif column[0] == 'code':
                    order = 'code'
                    break
            elif isinstance(column, dict):
                name = column.get('data_index')
                if name == 'name':
                    order = 'name'
                elif name == 'code':
                    order = 'code'
                    break 
                
        query = query.order_by(order) if order else query.all()
    return query

def create_search_filter(filter_text, fields):
    '''
    Фильтрация производится по полям списку полей fields и введеному пользователем тексту filter_text.
    Пример:
        fields = ['name', 'family']
        filter_text = u'Вася Пупкин'
    Получится условие WHERE:
        (name like 'Вася' AND name like 'Пупкин') OR (family like 'Вася' AND family like 'Пупкин') OR
        ((name like 'Вася' and family like 'Пупкин') OR (name like 'Пупкин' and family like 'Вася'))
    В случае если нет полей для поиска и выражение Q не сформировалось возвращает None
    '''
    def create_filter(words,fields):
        #TODO: нужна оптимизация для исключения повторяющихся условий - сейчас условия повторяются
        filter = None
        if not words or not fields:
            return filter
        
        if len(words) == 0 or len(fields) == 0:
            return filter
        
        if len(words) == 1 and len(fields) == 1:
            filter = Q(**{fields.pop() + '__icontains': words.pop()})
            #filter = '('+fields.pop()+'='+words.pop()+')'
            return filter
        
        if len(words) > 0 and len(fields) == 1:
            field = fields.pop()
            for word in words:
                fltr = Q(**{field + '__icontains': word})
                filter = filter & fltr if filter else fltr
                #fltr = '('+field+'='+word+')'
                #filter = filter+' and '+fltr if filter else fltr
            return filter
        
        for word in words:
            filtr = None
            for field in fields:
                sub_fltr = create_filter(set(words)-set([word]),set(fields)-set([field]))
                if sub_fltr:
                    fltr = (Q(**{field + '__icontains': word}) & sub_fltr)
                    #fltr = '('+field+'='+word+' and '+sub_fltr+')'
                else:
                    fltr = Q(**{field + '__icontains': word})
                    #fltr = '('+field+'='+word+')'
                filtr = (filtr | fltr) if filtr else fltr
                #filtr = '('+filtr+' or '+fltr+')' if filtr else fltr
            filter = (filter | filtr) if filter else filtr
            #filter = '('+filter+' or '+filtr+')' if filter else filtr
        return filter

    if filter_text:
        words = filter_text.strip().split(' ')
        condition = None
        for field_name in fields:
            field_condition = None
            for word in words:
                q = Q(**{field_name + '__icontains': word})
                field_condition = field_condition & q if field_condition else q            
            condition = condition | field_condition if condition else field_condition
        
        # дополнительное условие, если встречаются объединение слов
        cond = create_filter(set(words),set(fields))
        if cond:
            condition = condition | cond if condition else cond
        return condition
    else:
        return None

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
    id = extract_int(request, 'id')
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
    id = extract_int(request, 'id')
    obj = obj_factory(id)
    # Биндим форму к объекту
    win.form.to_object(obj)
    return obj

def safe_delete_record(model, id=None):
    '''
    Безопасное удаление записи в базе. В отличие от джанговского ORM не удаляет каскадно.
    Возвращает True в случае успеха, иначе False 
    '''
    assert (isinstance(model, models.Model) or issubclass(model, models.Model))
    assert (isinstance(id, int) or isinstance(id, long) or id is None)
    if isinstance(model, models.Model):
        models.signals.pre_delete.send(sender=model.__class__, instance=model)
    else:
        models.signals.pre_delete.send(sender=model, instance=id) #наверно лучше передать id чем вирутальный model(id=id)
    try:
        cursor = connection.cursor() #@UndefinedVariable
        id = id if id is not None else model.id
        sql = "DELETE FROM %s WHERE id = %s" % (connection.ops.quote_name(model._meta.db_table), id)
        cursor.execute(sql)
        transaction.commit_unless_managed()
    except Exception, e:
        # Встроенный в Django IntegrityError не генерируется. Кидаются исключения 
        # специфичные для каждого драйвера БД. Но по спецификации PEP 249 все они
        # называются IntegrityError
        if e.__class__.__name__ == 'IntegrityError':
            return False
        raise
    if isinstance(model, models.Model):
        models.signals.post_delete.send(sender=model.__class__, instance=model)
    else:
        models.signals.post_delete.send(sender=model, instance=id) #наверно лучше передать id чем вирутальный model(id=id)
    
    return True

def fetch_search_tree(model, filter, branch_id = None):
    '''
    По заданному фильтру filter и модели model формирует развернутое дерево с результатами поиска.
    Если filter пустой, то получается полностью развернутое дерево.
    '''
    #branch_id - это элемент ограничивающий дерево, т.е. должны возвращаться только дочерние ему элементы
    # Сначала тупо получаем все узлы подходящие по фильтру
    if branch_id and hasattr(model,'get_descendants'):
        branch_node = model.objects.get(id = branch_id)
        nodes = branch_node.get_descendants().select_related('parent')
    else:
        nodes = model.objects.all().select_related('parent')
        
    if filter:
        nodes = nodes.filter(filter)
    
    # Из каждого узла создаем полный путь до корня
    paths = []
    processed_nodes = set()
    for node in nodes:
        # Проверяем не входит ли наш узел в один из просчитанных путей
        if node in processed_nodes:
            continue

        path = [node]
        while node.parent:
            if branch_id and node.parent == branch_node:
                break
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
            index = sub_tree.index(path_slice[0])
        except ValueError:
            sub_tree.append( create_one_tree(path_slice) )
        else:
            if hasattr(sub_tree[index], 'children'):
                merge(sub_tree[index].children, path_slice[1:])
            else:
                # Значит сливаемый путь оказался длиннее чем высота поддерева
                sub_tree[index].children = [create_one_tree(path_slice[1:])]
                
    for path in paths[1:]:
        merge(tree, path)
    
    def set_tree_attributes(sub_tree):
        '''  Пробегает дерево и устанавливает узлам атрибуты expanded и leaf '''
        if not hasattr(sub_tree, 'children') or len(sub_tree.children) == 0:
            # не факт, что это лист, т.к. мы лишь фильтровали дерево - нужно проверить
            if hasattr(sub_tree,'is_leaf_node'):
                sub_tree.leaf = sub_tree.is_leaf_node()
            else:
                child_nodes = model.objects.filter(parent=sub_tree.id)
                if len(child_nodes) == 0:
                    sub_tree.leaf = True
        else:
            sub_tree.expanded = True
            for st in sub_tree.children:
                set_tree_attributes(st)
    
    for sub_tree in tree:
        set_tree_attributes(sub_tree)
    
    return tree
    
def extract_int(request, key):
    ''' Извлекает целое число из запроса '''            
    try:
        value = request.REQUEST.get(key, None)
    except IOError as err:
        # В некоторых браузерах (предполагается что в ie) происходит следующие:
        # request.REQUEST читается и в какой-то момент связь прекращается
        # из-за того, что браузер разрывает соединение, в следствии этого происходит ошибка 
        # IOError: request data read error
        logger.warning(str(err))
    
    if value:
        return int(value)
    else:
        return 0
    
def extract_int_list(request, key):
    ''' Извлекает список целых чисел из запроса '''
    value = request.REQUEST.get(key, '')
    values = map(int, value.split(','))
    return values

def extract_list(request, key):
    data = request.POST.get(key)
    if data:
        obj = json.loads(data)
        if not isinstance(obj, list):
            obj = [obj]
        return obj
    return []

def apply_column_filter(query, request, map):
    '''
    Накладывает колоночный фильтр
    @param query: Запрос
    @param request: Данные с клиента включающие фильтры
    @param map: карта связи фильтров в request и полей в объекте: ключ - поле объекта, значение - параметр фильтра, например:
            {'unit__name':'unit_ref_name'}
    '''
    assert isinstance(map, dict)
    cond = None
    for key, value in map.items():
        filter_word = request.REQUEST.get(value)
        if filter_word:
            filter = Q(**{key+'__icontains': filter_word})
            cond = filter if not cond else (cond & filter)
    if cond:
        query = query.filter(cond)
    return query
