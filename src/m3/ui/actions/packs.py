#coding:utf-8

from django.db import transaction

from m3.ui.actions import ActionPack, Action, ExtUIScriptResult, PreJsonResult, OperationResult
from m3.ui.ext.windows.complex import ExtDictionaryWindow
from m3.ui.ext.misc.store import ExtJsonStore
from m3.ui.actions import utils
from m3.ui.ext.containers import ExtPagingBar

class DictListWindowAction(Action):
    '''
    Действие, которое возвращает окно со списком элементов справочника.
    '''
    url = '/list-window$'
    
    def create_window(self, request, context, mode):
        ''' Создаем и настраиваем окно '''
        base = self.parent
        win = base.list_form(mode=mode, title=base.title)
        win.height, win.width = base.height, base.width
        win.min_height, win.min_width = base.height, base.width
        
        win.init_grid_components()
        if base.list_paging:
            win.grid.bottom_bar = ExtPagingBar(page_size = 25)
        return win
            
    def create_columns(self, control, columns):
        ''' Добавляем отображаемые колонки. См. описание в базовом классе! '''
        for column in columns:
            if isinstance(column, tuple):
                column_params = { 'data_index': column[0], 'header': column[1], 'sortable': True }
                if len(column)>2:
                    column_params['width'] = column[2]
            elif isinstance(column, dict):
                column_params = column
            else:
                raise Exception('Incorrect parameter column.')
            control.add_column(**column_params)
    
    def configure_list(self, win):
        base = self.parent
        # Устанавливаем источники данных
        grid_store = ExtJsonStore(url = base.rows_action.get_absolute_url(), auto_load=True, remote_sort=True)
        grid_store.total_property = 'total'
        grid_store.root = 'rows'
        win.grid.set_store(grid_store)
        
        if not base.list_readonly:
            # Доступны 3 события: создание нового элемента, редактирование или удаление имеющегося
            win.url_new_grid    = base.edit_window_action.get_absolute_url()
            win.url_edit_grid   = base.edit_window_action.get_absolute_url()
            win.url_delete_grid = base.delete_action.get_absolute_url()
    
    def run(self, request, context):
        win = self.create_window(request, context, mode=0)
        self.create_columns(win.grid, self.parent.list_columns)
        self.configure_list(win)
        
        return ExtUIScriptResult(self.parent.get_list_window(win))
    
class DictSelectWindowAction(DictListWindowAction):
    '''
    Действие, возвращающее окно с формой выбора из справочника
    '''
    url = '/select-window$'
    
    def run(self, request, context):
        base = self.parent
        win = self.create_window(request, context, mode=1)
        win.modal = True
        self.create_columns(win.grid, self.parent.list_columns)
        self.configure_list(win)
        
        list_store = ExtJsonStore(url = base.last_used_action.get_absolute_url(), auto_load = False)
        win.list_view.set_store(list_store)
        
        win.column_name_on_select = 'name'
        return ExtUIScriptResult(self.parent.get_select_window(win))

class DictEditWindowAction(Action):
    '''
    Редактирование элемента справочника
    '''
    url = '/edit-window$'
    def run(self, request, context):
        base = self.parent
        # Получаем объект по id
        id = utils.extract_int(request, 'id')
        obj = base.get_row(id)
        # Разница между новым и созданным объектов в том, что у нового нет id или он пустой
        create_new = True
        if isinstance(obj, dict) and obj.get('id') != None:
            create_new = False
        elif hasattr(obj, 'id') and getattr(obj, 'id') != None:
            create_new = False
        if create_new and base.add_window:
            win = utils.bind_object_from_request_to_form(request, base.get_row, base.add_window)
        else:
            win = utils.bind_object_from_request_to_form(request, base.get_row, base.edit_window)
        if not win.title:
            win.title = base.title
        win.form.url = base.save_action.get_absolute_url()
        
        return ExtUIScriptResult(base.get_edit_window(win))

class DictRowsAction(Action):
    '''
    Действие, которое возвращает список записей справочника.
    Именно список записей, которые потом могут быть отображены в гриде.
    В качестве контекста выполнения может быть задано:
      a) текстовая строка с фильтром (для выполнения поиска);
      b) начальная позиция и смещение записей для пейджинга.
    '''
    url = '/rows$'
    def run(self, request, context):
        offset = utils.extract_int(request, 'start')
        limit = utils.extract_int(request, 'limit')
        filter = request.REQUEST.get('filter')
        direction = request.REQUEST.get('dir')
        user_sort = request.REQUEST.get('sort')
        if direction == 'DESC':
            user_sort = '-' + user_sort
        dict_list = []
        for item in self.parent.list_columns:
            if isinstance(item, (list, tuple)):
                dict_list.append(item[0])
            elif isinstance(item, dict) and item.get('data_index'):
                dict_list.append(item['data_index'])
        
        if hasattr(self.parent, 'modify_rows_query') and callable(self.parent.modify_rows_query):
            rows = self.parent.get_rows_modified(offset, limit, filter, user_sort, request, context)
        else:
            rows = self.parent.get_rows(offset, limit, filter, user_sort)
        return PreJsonResult(rows, self.parent.secret_json, dict_list = dict_list)
    
class DictLastUsedAction(Action):
    '''
    Действие, которое возвращает список последних использованных действий
    '''
    url = '/last-rows$'
    def run(self, request, context):
        return PreJsonResult(self.parent.get_last_used(self))

class ListGetRowAction(Action):
    '''
    Действие, которое отвечает за возврат данных для одного отдельно-взятой записи справочника
    '''
    url = '/item$'
    def run(self, request, context):
        id = utils.extract_int(request, 'id')
        result = self.parent.get_row(id)
        return PreJsonResult(result)

class DictSaveAction(Action):
    '''
    Действие выполняет сохранение записи справочника.
    '''
    url = '/save$'
    def run(self, request, context):
        id = utils.extract_int(request, 'id')
        if not id and self.parent.add_window:
            obj = utils.bind_request_form_to_object(request, self.parent.get_row, self.parent.add_window)
        else:
            obj = utils.bind_request_form_to_object(request, self.parent.get_row, self.parent.edit_window)
        result = self.parent.save_row(obj)
        if isinstance(result, OperationResult) and result.success == True:
            # узкое место. после того, как мы переделаем работу экшенов,
            # имя параметра с идентификатором запси может уже называться не 
            # id
            context.id = obj.id
        return result
    
class ListDeleteRowAction(Action):
    url = '/delete_row$'
    def run(self, request, context):
        '''
        Удаляться одновременно могут несколько объектов. Их ключи приходят разделенные запятыми.
        '''
        ids = utils.extract_int_list(request, 'id')
        objs = [self.parent.get_row(id) for id in ids]
        return self.parent.delete_row(objs)

class BaseDictionaryActions(ActionPack):
    '''
    Пакет с действиями, специфичными для работы со справочниками
    '''
    # Заголовок окна справочника
    title = ''
    # Список колонок состоящий из кортежей (имя json поля, имя колонки в окне)
    list_columns = []
    # Окно для редактирования элемента справочника 
    edit_window = None
    add_window = None
    list_form   = ExtDictionaryWindow
    select_form = ExtDictionaryWindow
    # Настройки секретности. Если стоит истина, то в результат добавляется флаг секретности
    secret_json = False
    secret_form = False
    # Ширина и высота окна
    width = 510
    height = 400
    
    list_paging = True
    list_readonly = False
    
    def __init__(self):
        super(BaseDictionaryActions, self).__init__()
        # В отличие от обычных паков в этом экшены создаются самостоятельно, а не контроллером
        # Чтобы было удобно обращаться к ним по имени
        self.list_window_action   = DictListWindowAction()
        self.select_window_action = DictSelectWindowAction()
        self.edit_window_action   = DictEditWindowAction()
        self.rows_action          = DictRowsAction()
        self.last_used_action     = DictLastUsedAction()
        self.row_action           = ListGetRowAction()
        self.save_action          = DictSaveAction()
        self.delete_action        = ListDeleteRowAction()
        # Но привязать их все равно нужно
        self.actions = [self.list_window_action, self.select_window_action, self.edit_window_action,\
                        self.rows_action, self.last_used_action, self.row_action, self.save_action,\
                        self.delete_action]
    
    #==================== ФУНКЦИИ ВОЗВРАЩАЮЩИЕ АДРЕСА =====================    
    def get_list_url(self):
        '''
        Возвращает адрес формы списка элементов справочника. 
        Используется для присвоения адресов в прикладном приложении.
        '''
        return self.list_window_action.get_absolute_url()
    
    def get_select_url(self):
        '''
        Возвращает адрес формы списка элементов справочника. 
        Используется для присвоения адресов в прикладном приложении.
        '''
        return self.select_window_action.get_absolute_url()
    
    def get_edit_url(self):
        '''
        Возвращает адрес формы редактирования элемента справочника.
        '''
        return self.edit_window_action.get_absolute_url()
    
    def get_rows_url(self):
        '''
        Возвращает адрес по которому запрашиваются элементы грида
        '''
        return self.rows_action.get_absolute_url()
    
    #==================== ФУНКЦИИ ВОЗВРАЩАЮЩИЕ ДАННЫЕ =====================
    def get_rows(self, offset, limit, filter, user_sort=''):
        '''
        Метод который возвращает записи грида в виде обычного питоновского списка.
        '''
        raise NotImplementedError()
    
    def get_row(self, id):
        '''
        Метод, который возвращает запись справочника с указанным идентификатором.  
        '''
        raise NotImplementedError()
    
    def get_last_used(self):
        '''
        Метод, который возвращает список записей справочника, которые были выбраны
        конкретным пользователем в последнее время. 
        Записи возвращаются в виде обычного питоновского списка.
        '''
        raise NotImplementedError()
    
    def save_row(self, obj):
        '''
        Метод, который выполняет сохранение записи справочника. На момент запуска метода 
        в параметре object находится именно та запись справочника, которую необходимо сохранить.
        '''
        raise NotImplementedError()
    
    def delete_row(self, obj):
        '''
        Метод, который выполняет удаление записи справочника. На момент запуска метода в 
        параметре object находится именно та запись справочника, которую необходимо удалить.
        '''
        raise NotImplementedError()
    
    #====================== РАБОТА С ОКНАМИ ===============================
    def get_list_window(self, win):
        ''' Возвращает настроенное окно типа "Список" справочника '''        
        return win
    
    def get_select_window(self, win):
        ''' Возвращает настроенное окно выбора из справочника '''
        return win
    
    def get_edit_window(self, win):
        ''' Возвращает настроенное окно редактирования элемента справочника '''
        return win

class BaseDictionaryModelActions(BaseDictionaryActions):
    '''
    Класс, который реализует действия со справочником, записи которого являются моделями.
    '''
    # Настройки вида справочника (задаются конечным разработчиком)
    model = None
    # Список полей модели по которым будет идти поиск
    filter_fields = []
    
    # Порядок сортировки элементов списка. Работает следующим образом:
    # 1. Если в list_columns модели списка есть поле code, то устанавливается сортировка по возрастанию этого поля;
    # 2. Если в list_columns модели списка нет поля code, но есть поле name, то устанавливается сортировка по возрастанию поля name;
    # Пример list_sort_order = ['code', '-name']
    list_sort_order = None
    
    def get_rows_modified(self, offset, limit, filter, user_sort='', request=None, context=None):
        '''
        Возвращает данные для грида справочника
        '''
        sort_order = [user_sort] if user_sort else self.list_sort_order
        query = utils.apply_sort_order(self.model.objects, self.list_columns, sort_order)
        query = utils.apply_search_filter(query, filter, self.filter_fields)
        if hasattr(self, 'modify_rows_query') and callable(self.modify_rows_query):
            query = self.modify_rows_query(query, request, context)
        total = query.count()
        if limit > 0:
            query = query[offset: offset + limit]
        result = {'rows': list(query.all()), 'total': total}
        return result
    
    def get_rows(self, offset, limit, filter, user_sort=''):
        sort_order = [user_sort] if user_sort else self.list_sort_order
        query = utils.apply_sort_order(self.model.objects, self.list_columns, sort_order)
        query = utils.apply_search_filter(query, filter, self.filter_fields)
        total = query.count()
        if limit > 0:
            query = query[offset: offset + limit]
        result = {'rows': list(query.all()), 'total': total}
        return result
    
#    def modify_rows_query(self, query, request, context):
#        '''
#        Модифицирует запрос на получение данных. Данный метод необходимо определить в 
#        дочерних классах.
#        '''
#        return query
    
    def get_row(self, id):
        assert isinstance(id, int)
        # Если id нет, значит нужно создать новый объект
        if id == 0:
            record = self.model()
        else:
            try:
                record = self.model.objects.get(id = id)
            except self.model.DoesNotExist:
                return None
        return record
    
    @transaction.commit_on_success
    def save_row(self, obj):
        obj.save()
        return OperationResult(success = True)

    def delete_row(self, objs):
        message = ''
        if len(objs) == 0:
            message = u'Элемент не существует в базе данных.'
        else:
            for obj in objs:
                if not utils.safe_delete_record(obj):
                    message += u'Не удалось удалить элемент %s. Возможно на него есть ссылки.<br>' % obj.id
        
        return OperationResult.by_message(message)


class BaseEnumerateDictionary(BaseDictionaryActions):
    '''
    Базовый экшен пак для построения справочников основанных на перечислениях, т.е.
    предопределенных неизменяемых наборах значений. 
    '''
    # Класс перечисление с которым работает справочник
    enumerate_class = None
    
    list_paging = False # Значений как правило мало и они влезают в одну страницу грида
    list_readonly = True
    list_columns = [('code', 'Код', 15),
                    ('name', 'Наименование')]
    
    def get_rows(self, offset, limit, filter, user_sort=''):
        ''' Возвращает данные для грида справочника '''
        assert self.enumerate_class != None, 'Attribute enumerate_class is not defined.'
        data = []
        for k, v in self.enumerate_class.values.items():
            if filter and v.upper().find(filter.upper())<0:
                continue
            else:
                data.append({'id': k, 'code': k, 'name': v} )

        result = {'rows': data, 'total': len(data)}
        return result
    
    def get_row(self, id):
        ''' Заглушка для работы биндинга. В случае с перечислениями сам id хранится в БД '''
        assert isinstance(id, int)
        assert id in self.enumerate_class.keys(), 'Enumarate key "%s" is not defined in %s' % (id, self.enumerate_class)
        return id
    
