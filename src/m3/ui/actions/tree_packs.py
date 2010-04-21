#coding:utf-8
'''
Паки для иерархических справочников
'''
from m3.ui.actions import ActionPack, Action, PreJsonResult, ExtUIScriptResult, OperationResult
from m3.ui.actions.utils import apply_search_filter, bind_object_from_request_to_form,\
    bind_request_form_to_object, safe_delete_record, fetch_search_tree, create_search_filter
from m3.ui.ext.windows.complex import ExtTreeDictionaryWindow
from m3.ui.ext.misc.store import ExtJsonStore

class TreeGetNodesAction(Action):
    '''
    Вызывает функцию получения узлов дерева у родительского пака
    '''
    url = '/nodes$'
    def run(self, request, context):
        parent_id = int(request.REQUEST.get('node', 0))
        if parent_id < 1:
            parent_id = None
        filter = request.REQUEST.get('filter')
        result = self.parent.get_nodes(parent_id, filter)
        return PreJsonResult(result)

class TreeGetNodeAction(Action):
    '''
    Вызывает функцию получения узла дерева (нужно для редактирования в карточке)
    '''
    url = '/node$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        result = self.parent.get_node(id)
        return PreJsonResult(result)

class TreeSaveNodeAction(Action):
    '''
    Вызывает функцию сохранения узла дерева.
    '''
    url = '/save_node$'
    def run(self, request, context):
        # Создаем форму для биндинга к ней
        win = self.parent.edit_node_window()
        win.form.bind_to_request(request)
        # Получаем наш объект по id
        id = request.REQUEST.get('id')
        obj = self.parent.get_node(id)
        # Биндим форму к объекту
        win.form.to_object(obj)
        return self.parent.save_node(obj)

class TreeDeleteNodeAction(Action):
    '''
    Получает узел из запроса и откправляет его на удаление
    '''
    url = '/delete_node$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        obj = self.parent.get_node(id)
        return self.parent.delete_node(obj)

class ListGetRowsAction(Action):
    '''
    Возвращает элементы принадлежание к узлу дерева в готовом для сериализации виде
    '''
    url = '/rows$'
    def run(self, request, context):
        parent_id = request.REQUEST.get('id')
        offset = int(request.REQUEST.get('offset', 0))
        limit = int(request.REQUEST.get('limit', 0))
        filter = request.REQUEST.get('filter')
        result = self.parent.get_rows(parent_id, offset, limit, filter)
        return PreJsonResult(result)

class ListGetRowAction(Action):
    url = '/item$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        result = self.parent.get_row(id)
        return PreJsonResult(result)

class ListSaveRowAction(Action):
    url = '/row$'
    def run(self, request, context):
        obj = bind_request_form_to_object(request, self.parent.get_row, self.parent.edit_window)
        return self.parent.save_row(obj)

class ListDeleteRowAction(Action):
    url = '/delete_row$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        obj = self.parent.get_row(id)
        return self.parent.delete_row(obj)

class ListLastUsedAction(Action):
    url = '/last-rows$'
    def run(self, request, context):
        return PreJsonResult(self.parent.get_last_used(self))

class EditGridWindowAction(Action):
    '''
    Экшен создает окно для редактирования элемента справочника (списка)
    '''
    url = '/grid_edit_window$'
    def run(self, request, context):
        base = self.parent
        win = bind_object_from_request_to_form(request, base.get_row, base.edit_window)
        win.title = base.title
        win.form.url = base.save_row_action.get_absolute_url()
        
        return ExtUIScriptResult(base.get_edit_window(win))

class EditNodeWindowAction(Action):
    '''
    Экшен создает окно для редактирования узла дерева
    '''
    url = '/node_edit_window$'
    def run(self, request, context):
        base = self.parent
        win = bind_object_from_request_to_form(request, base.get_node, base.edit_node_window)
        win.title = base.title
        win.form.url = base.save_node_action.get_absolute_url()
        
        return ExtUIScriptResult(base.get_node_edit_window(win))

class SelectWindowAction(Action):
    '''
    Экшен создает и настраивает окно справочника в режиме выбора
    '''
    url = '/get_select_window$'
    def run(self, request, context):
        # Создаем окно выбора
        base = self.parent
        win = self.parent.list_window(title = base.title, mode = 1)
        
        # Добавляем отображаемые колонки
        for field, name in base.list_columns:
            win.grid.add_column(header = name, data_index = field)
            
        # Устанавливаем источники данных
        grid_store = ExtJsonStore(url = base.get_rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(grid_store)
        win.tree.url = base.get_nodes_action.get_absolute_url()
        
        #win.column_name_on_select = 'fname'
        #win.list_view.add_column(header=u'Имя', data_index = 'fname')
        #win.list_view.add_column(header=u'Фамилия', data_index = 'lname')
        #win.list_view.add_column(header=u'Адрес', data_index = 'adress')
        #win.list_view.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=False))
        
        win = self.parent.get_select_window(win)
        return ExtUIScriptResult(win)
        
class ListWindowAction(Action):
    '''
    Экшен создает и настраивает окно справочника в режиме редактирования записей
    '''
    url = '/get_list_window$'
    def run(self, request, context):
        # Создаем окно
        base = self.parent
        win = self.parent.list_window(title = base.title, mode = 0)
        
        # Добавляем отображаемые колонки
        for field, name in base.list_columns:
            win.grid.add_column(header = name, data_index = field)
        for field, name in base.tree_columns:
            win.tree.add_column(header = name, data_index = field)
        
        # Устанавливаем источники данных
        grid_store = ExtJsonStore(url = base.get_rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(grid_store)
        win.tree.url = base.get_nodes_action.get_absolute_url()
        
        # Доступны 3 события для грида: создание нового элемента, редактирование или удаление имеющегося 
        win.url_new_grid    = base.edit_grid_window_action.get_absolute_url()
        win.url_edit_grid   = base.edit_grid_window_action.get_absolute_url()
        win.url_delete_grid = base.delete_row_action.get_absolute_url()
        
        # Доступны 3 события для дерева: создание нового узла, редактирование или удаление имеющегося
        win.url_new_tree    = base.edit_node_window_action.get_absolute_url()
        win.url_edit_tree   = base.edit_node_window_action.get_absolute_url()
        win.url_delete_tree = base.delete_node_action.get_absolute_url()
        
        # Копипаст из примера
        #win.tree.add_column(header=u'Имя', data_index = 'fname', width=100)
        
        win = self.parent.get_list_window(win)
        return ExtUIScriptResult(win)

class BaseTreeDictionaryActions(ActionPack):
    '''
    Пакет с действиями, специфичными для работы с иерархическими справочниками
    '''
    # Список колонок состоящий из кортежей (имя json поля, имя колонки в окне)
    list_columns = []
    # Заголовок окна справочника
    title = ''
    # Окно редактирования узла дерева
    edit_node_window = None
    # Окно редактирования элемента списка
    edit_window = None
    # Окно самого справочника
    list_window = ExtTreeDictionaryWindow
    
    def __init__(self):
        # Экшены специфичные для дерева
        self.get_nodes_action = TreeGetNodesAction()
        self.get_node_action = TreeGetNodeAction()
        self.save_node_action = TreeSaveNodeAction()
        self.delete_node_action = TreeDeleteNodeAction()
        # Экшены специфичные для списка
        self.get_rows_action = ListGetRowsAction()
        self.get_row_action = ListGetRowAction()
        self.save_row_action = ListSaveRowAction()
        self.delete_row_action = ListDeleteRowAction()
        self.last_used_action = ListLastUsedAction()
        # Само окно справочника
        self.list_window_action = ListWindowAction()
        self.select_window_action = SelectWindowAction()
        self.edit_grid_window_action = EditGridWindowAction()
        self.edit_node_window_action = EditNodeWindowAction()
        # Привязываем всех их к паку
        self.actions = [self.get_nodes_action, self.get_node_action, self.save_node_action,
                        self.delete_node_action, self.get_rows_action, self.get_row_action,
                        self.save_row_action, self.delete_row_action, self.list_window_action,
                        self.select_window_action, self.edit_grid_window_action, self.edit_node_window_action]
    
    #========================== ДЕРЕВО ===========================
    
    def get_nodes(self, parent_id, filter):
        raise NotImplementedError()
    
    def get_node(self, id):
        raise NotImplementedError()
    
    def save_node(self, obj, parent_id):
        raise NotImplementedError()
    
    def delete_node(self, obj):
        raise NotImplementedError()
    
    #========================== СПИСОК ===========================
    
    def get_rows(self, offset, limit, filter, parent_id):
        raise NotImplementedError()
    
    def get_row(self, id):
        raise NotImplementedError()
    
    def save_row(self, obj, parent_id):
        raise NotImplementedError()
    
    def delete_row(self, obj):
        raise NotImplementedError()
    
    #========================== ФОРМА ============================
    
    def get_select_window(self, win):
        return win
    
    def get_select_url(self):
        return self.select_window_action.get_absolute_url()
    
    def get_list_window(self, win):
        return win
    
    def get_list_url(self):
        return self.list_window_action.get_absolute_url()
    
    #============ ДЛЯ ИЗМЕНЕНИЯ ОКОН РЕДАКТИРОВАНИЯ НА ХОДУ ======
    
    def get_edit_window(self, win):
        return win
    
    def get_node_edit_window(self, win):
        return win 

class BaseTreeDictionaryModelActions(BaseTreeDictionaryActions):
    '''
    Класс реализует действия над иерархическим справочников основанным на моделях
    '''
    # Обязательная модель дерева
    tree_model = None
    # Не обязательная модель списка связанного с деревом
    list_model = None
    # Поля по которым производится поиск в списке
    filter_fields = []
    # Поля по которым производится поиск в дереве
    tree_filter_fields = []
    # Список из кортежей с параметрами выводимых в грид колонок
    list_columns = []
    # Список из кортежей с параметрами выводимых в дерево колонок
    tree_columns = []
        
    def get_nodes(self, parent_id, filter):
        if filter:
            filter_dict = create_search_filter(filter, self.tree_filter_fields)
            nodes = fetch_search_tree(self.tree_model, filter_dict)
        else:
            query = self.tree_model.objects.filter(parent = parent_id)
            nodes = list(query.all())        
            # Если имеем дело с листом, нужно передавать параметр leaf = true
            for node in nodes:
                if self.tree_model.objects.filter(parent = node.id).count() == 0:
                    node.leaf = 'true'
                    
        return nodes
    
    def get_rows(self, parent_id, offset, limit, filter):
        query = self.list_model.objects.filter(group = parent_id)
        query = apply_search_filter(query, filter, self.filter_fields)
        items = list(query.all())
        return items
    
    def _get_obj(self, model, id):
        '''
        Возвращает запись заданной модели model по id
        Если id нет, значит нужно создать новый объект
        '''
        if (id == None) or (len(id) == 0):
            obj = model()
        else:
            try:
                obj = model.objects.get(id = id)
            except model.DoesNotExist:
                return None
        return obj
    
    def get_node(self, id):
        return self._get_obj(self.tree_model, id)
    
    def get_row(self, id):
        return self._get_obj(self.list_model, id)
    
    def save_row(self, obj):
        obj.save()
        return OperationResult(success = True)
    
    def save_node(self, obj):
        obj.save()
        return OperationResult(success = True)
    
    def delete_row(self, obj):
        message = ''
        if not safe_delete_record(self.list_model, obj.id):
            message = u'Не удалось удалить элемент'
        return OperationResult.by_message(message)
        
    def delete_node(self, obj):
        message = ''
        if not safe_delete_record(self.tree_model, obj.id):
            message = u'Не удалось удалить группу'
        return OperationResult.by_message(message)
        