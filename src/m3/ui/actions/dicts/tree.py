#coding:utf-8
'''
Created on 29.01.2011

@author: akvarats
'''

from django.db import transaction
from django.dispatch import Signal

from m3.ui import actions

from m3.ui.actions import ActionPack, Action, PreJsonResult, ExtUIScriptResult, OperationResult,\
    ActionContextDeclaration
from m3.ui.actions import utils
from m3.ui.ext.misc.store import ExtJsonStore
from m3.ui.ext.windows.complex import ExtDictionaryWindow
from m3.ui.actions.packs import ListDeleteRowAction
from m3.ui.ext.containers import ExtPagingBar
from m3.db import BaseObjectModel, safe_delete
from m3.core.exceptions import RelatedError
from m3.ui.actions.results import ActionResult


class TreeGetNodesAction(Action):
    '''
    Вызывает функцию получения узлов дерева у родительского пака
    '''
    url = '/nodes'
    
    def context_declaration(self):
        return [actions.ACD(name='node', type=int, required=True, default=0),
                actions.ACD(name='filter', type=str, required=True, default=0),]
    
    def run(self, request, context):
        '''
        '''
        parent_id = context.node if context.node > 0 else None
        return actions.PreJsonResult(self.parent.get_nodes(request, context, parent_id, context.filter))
    
class TreeGetNodesLikeRows(Action):
    '''
    Возвращает узлы дерева как список. Используется для автокомплита.
    '''
    url = '/nodes_like_rows$'
    
    def context_declaration(self):
        return [ActionContextDeclaration(name='filter', default='', type=str, required=True),
                ActionContextDeclaration(name='branch_id', default=0, type=int, required=True)]
    
    def run(self, request, context):
        result = self.parent.get_nodes_like_rows(request, context, context.filter, context.branch_id)
        return PreJsonResult(result)
    

class TreeGetNodeAction(Action):
    '''
    Вызывает функцию получения узла дерева (нужно для редактирования в карточке)
    '''
    url = '/node$'
    def run(self, request, context):
        id = utils.extract_int(request, 'id')
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
        id = utils.extract_int(request, 'id')
        obj = self.parent.get_node(id)
        # Биндим форму к объекту
        win.form.to_object(obj)
        result = self.parent.validate_node(obj, request)
        if result:
            assert isinstance(result, ActionResult)
            return result
        
        return self.parent.save_node(obj)

class TreeDeleteNodeAction(Action):
    '''
    Получает узел из запроса и откправляет его на удаление
    '''
    url = '/delete_node$'
    def run(self, request, context):
        id = utils.extract_int(request, self.parent.contextTreeIdName)
        obj = self.parent.get_node(id)
        return self.parent.delete_node(obj)

class ListGetRowsAction(Action):
    '''
    Возвращает элементы принадлежание к узлу дерева в готовом для сериализации виде
    '''
    url = '/rows$'
    def run(self, request, context):
        parent_id = utils.extract_int(request, 'id')
        offset = utils.extract_int(request, 'start')
        limit = utils.extract_int(request, 'limit')
        filter = request.REQUEST.get('filter')
        result = self.parent.get_rows(request, context, parent_id, offset, limit, filter)
        return PreJsonResult(result)

class ListGetRowAction(Action):
    url = '/item$'
    def run(self, request, context):
        id = utils.extract_int(request, 'id')
        result = self.parent.get_row(id)
        return PreJsonResult(result)

class ListSaveRowAction(Action):
    url = '/row$'
    def run(self, request, context):
        obj = utils.bind_request_form_to_object(request, self.parent.get_row, self.parent.edit_window)
        result = self.parent.validate_row(obj, request)
        if result:
            assert isinstance(result, ActionResult)
            return result
        return self.parent.save_row(obj)

class ListLastUsedAction(Action):
    url = '/last-rows$'
    def run(self, request, context):
        return PreJsonResult(self.parent.get_last_used(self))

class ListEditRowWindowAction(Action):
    '''
    Экшен создает окно для редактирования элемента справочника (списка)
    '''
    url = '/grid_edit_window$'
    def run(self, request, context):
        base = self.parent
        win = utils.bind_object_from_request_to_form(request, base.get_row, base.edit_window)
        win.orig_request = request
        win.orig_context = context
        if not win.title:
            win.title = base.title
        win.form.url = base.save_row_action.get_absolute_url()
        
        # проверим право редактирования
        if not self.parent.has_sub_permission(request.user, self.parent.PERM_EDIT, request):
            win.make_read_only(access_off=True, exclude_list=['cancel_btn','close_btn'])
        
        return ExtUIScriptResult(base.get_edit_window(win))
    
class ListNewRowWindowAction(Action):
    '''
    Экшен для создания нового элемента списка
    '''
    url = '/grid_new_window$'
    
    def context_declaration(self):
        return [ActionContextDeclaration(name=self.parent.contextTreeIdName, type=int, required=True, verbose_name=u'Код группы')]
    
    def run(self, request, context):
        base = self.parent
        # Создаем новую группу и биндим ее к форме
        obj = base.get_row()
        setattr(obj, base.list_parent_field + '_id', getattr(context,base.contextTreeIdName))
        win = base.edit_window(create_new = True)
        win.orig_request = request
        win.orig_context = context
        win.form.from_object(obj)
        # Донастраиваем форму
        if not win.title:
            win.title = base.title
        win.form.url = base.save_row_action.get_absolute_url()
        
        return ExtUIScriptResult(base.get_edit_window(win))
        

class TreeEditNodeWindowAction(Action):
    '''
    Экшен создает окно для редактирования узла дерева
    '''
    url = '/node_edit_window$'
    def run(self, request, context):
        base = self.parent
        win = utils.bind_object_from_request_to_form(request, base.get_node, base.edit_node_window, base.contextTreeIdName)
        win.orig_request = request
        win.orig_context = context
        if not win.title:
            win.title = base.title
        win.form.url = base.save_node_action.get_absolute_url()
        
        # проверим право редактирования
        if not self.parent.has_sub_permission(request.user, self.parent.PERM_EDIT, request):
            win.make_read_only(access_off = True, exclude_list = ['close_btn','cancel_btn'])
        
        return ExtUIScriptResult(base.get_node_edit_window(win))
    
class TreeNewNodeWindowAction(Action):
    '''
    Экшен создает окно для создания нового узла дерева
    '''
    url = '/node_new_window$'
    def run(self, request, context):
        base = self.parent
        # Получаем id родительской группы. Если приходит не валидное значение, то создаем узел в корне
        parent_id = utils.extract_int(request, base.contextTreeIdName)
        if parent_id < 1:
            parent_id = None
        # Создаем новую группу и биндим ее к форме
        obj = base.get_node()
        obj.parent_id = parent_id
        win = base.edit_node_window(create_new = True)
        win.orig_request = request
        win.orig_context = context
        win.form.from_object(obj)
        # Донастраиваем форму
        if not win.title:
            win.title = base.title
        win.form.url = base.save_node_action.get_absolute_url()
        
        return ExtUIScriptResult(base.get_node_edit_window(win))

class TreeDragAndDropAction(Action):
    '''
    Экшен перетаскивает узел дерева внутри самого дерева
    '''
    url = '/drag_node$'
    def run(self, request, context):
        id = utils.extract_int(request, 'id')
        dest_id = utils.extract_int(request, 'dest_id')
        return self.parent.drag_node(id, dest_id)

class ListDragAndDropAction(Action):
    '''
    Экшен перетаскивает запись из списка в другой узел дерева
    '''
    url = '/drag_item$'
    def run(self, request, context):
        ids = utils.extract_int_list(request, 'id')
        dest_id = utils.extract_int(request, 'dest_id')
        return self.parent.drag_item(ids, dest_id)
    
class ListWindowAction(Action):
    '''
    Экшен создает и настраивает окно справочника в режиме редактирования записей
    '''
    url = '/get_list_window$'
    
    def create_window(self, request, context, mode):
        ''' Создаем и настраиваем окно ''' 
        base = self.parent
        win = self.parent.list_window(title=base.title, mode=mode)
        win.height, win.width = base.height, base.width
        win.min_height, win.min_width = base.height, base.width
        
        if base.list_model:
            win.init_grid_components()
            if base.list_paging:
                win.grid.bottom_bar = ExtPagingBar(page_size = 25)
        win.init_tree_components()
        win.tree.width = base.tree_width
        win.tree.root_text = base.title
        win.contextTreeIdName = base.contextTreeIdName
        
        return win
    
    def create_columns(self, control, columns):
        ''' Добавляем отображаемые колонки. См. описание в базовом классе! '''
        for column in columns:
            if isinstance(column, tuple):
                column_params = { 'data_index': column[0], 'header': column[1]}
                if len(column)>2:
                    column_params['width'] = column[2]
            elif isinstance(column, dict):
                column_params = column
            else:
                raise Exception('Incorrect parameter column.')
            control.add_column(**column_params)
    
    def configure_list(self, win, request, context):
        ''' Настраивает грид (список элементов) '''
        base = self.parent
        if base.list_model:
            self.create_columns(win.grid, base.list_columns)
                
        # Устанавливаем источники данных
        if base.list_model: 
            grid_store = ExtJsonStore(url = base.rows_action.get_absolute_url(), auto_load = True)
            grid_store.total_property = 'total'
            grid_store.root = 'rows'
            win.grid.set_store(grid_store)
        # Доступны 3 события для грида: создание нового элемента, редактирование или удаление имеющегося
        if base.list_model and not base.list_readonly:
            win.url_new_grid    = base.new_grid_window_action.get_absolute_url()
            win.url_edit_grid   = base.edit_grid_window_action.get_absolute_url()
            win.url_delete_grid = base.delete_row_action.get_absolute_url()
            # Драг&Дроп
            if not base.tree_readonly:
                win.url_drag_grid = base.drag_list.get_absolute_url()
    
    def configure_tree(self, win, request, context):
        ''' Настраивает дерево групп '''
        base = self.parent
        # Добавляем отображаемые колонки
        for column in base.tree_columns:
            if isinstance(column, tuple):
                column_params = { 'data_index': column[0], 'header': column[1]}
                if len(column)>2:
                    if column[2]==0:
                        column_params['hidden'] = True
                    else:
                        column_params['width'] = column[2]
                else:
                    column_params['width'] = 10
            elif isinstance(column, dict):
                column_params = column
            else:
                raise Exception('Incorrect parameter column.')
            win.tree.add_column(**column_params)
        # Устанавливаем источники данных
        win.tree.url = base.nodes_action.get_absolute_url()
        # События для дерева
        if not base.tree_readonly:
            # Доступны 3 события для дерева: создание нового узла, редактирование или удаление имеющегося
            win.url_new_tree    = base.new_node_window_action.get_absolute_url()
            win.url_edit_tree   = base.edit_node_window_action.get_absolute_url()
            win.url_delete_tree = base.delete_node_action.get_absolute_url()
            # Драг&Дроп
            win.url_drag_tree = base.drag_tree.get_absolute_url()
    
    def configure_other(self, win, request, context):
        pass
    
    def run(self, request, context):
        win = self.create_window(request, context, 0)
        win.orig_request = request
        win.orig_context = context
        self.configure_tree(win, request, context)
        self.configure_list(win, request, context)
        self.configure_other(win, request, context)        
        win = self.parent.get_list_window(win)
        
        # проверим право редактирования
        if not self.parent.has_sub_permission(request.user, self.parent.PERM_EDIT, request):
            win.make_read_only()
                    
        return ExtUIScriptResult(win)

class SelectWindowAction(ListWindowAction):
    '''
    Экшен создает и настраивает окно справочника в режиме выбора
    '''
    url = '/get_select_window$'
    def run(self, request, context):
        # Создаем окно выбора
        win = self.create_window(request, context, 1)
        win.orig_request = request
        win.orig_context = context
        win.modal = True
        # Добавляем отображаемые колонки
        base = self.parent
        self.configure_list(win, request, context)
        self.configure_tree(win, request, context)
        
        # Ожидается в далеком будущем ;)
        #win.column_name_on_select = 'fname'
        #win.list_view.add_column(header=u'Имя', data_index = 'fname')
        #win.list_view.add_column(header=u'Фамилия', data_index = 'lname')
        #win.list_view.add_column(header=u'Адрес', data_index = 'adress')
        # Заглушка, иначе ругается что нет стора
        win.list_view.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=False))
        
        #win.column_name_on_select = 'name'
        win.column_name_on_select = base.column_name_on_select
        
        win = self.parent.get_select_window(win)
        win.contextTreeIdName = base.contextTreeIdName
        
        # проверим право редактирования
        if not self.parent.has_sub_permission(request.user, self.parent.PERM_EDIT, request):
            win.make_read_only()
                    
        return ExtUIScriptResult(win)

class BaseTreeDictionaryActions(ActionPack):
    '''
    Пакет с действиями, специфичными для работы с иерархическими справочниками
    '''
    # Список колонок состоящий из:
    # 1. вариант (классический)
    #    list_actions = [('code', u'Код'), ('name', u'Наименование')]
    # 2. вариант (классический расширенный) - третьим элементом в кортеже идет ширина
    #    list_actions = [('code', u'Код', 100), ('name', u'Наименование')]
    # 3. вариант (универсальный)
    #    list_actions = [{'name': 'code','header':u'Код', 'width': 100}, (...)]
    list_columns = []
    
    # Заголовок окна справочника
    title = ''
    # Окно редактирования узла дерева
    edit_node_window = None
    # Окно редактирования элемента списка
    edit_window = None
    # Окно самого справочника
    list_window = ExtDictionaryWindow
    # Ширина и высота окна
    width = 600
    height = 400
    tree_width = 200
    
    contextTreeIdName = 'id'
    
    # права доступа для базовых справочников
    PERM_EDIT = 'edit'
    sub_permissions = {PERM_EDIT: u'Редактирование справочника'}
    
    # Колонка для выбора по умолчанию
    column_name_on_select = 'name'
    
    def __init__(self):
        super(BaseTreeDictionaryActions, self).__init__()
        
        # Экшены отдающие данные
        self.nodes_action = TreeGetNodesAction()
        self.node_action  = TreeGetNodeAction()
        self.rows_action  = ListGetRowsAction()
        self.row_action   = ListGetRowAction()
        self.nodes_like_rows_action = TreeGetNodesLikeRows()
        self.last_used_action = ListLastUsedAction()
        self.actions.extend([self.nodes_action, 
                             self.node_action, 
                             self.rows_action,
                             self.row_action, 
                             self.last_used_action,
                             self.nodes_like_rows_action])
        
        # Окна самого справочника
        self.list_window_action   = ListWindowAction()
        self.select_window_action = SelectWindowAction()
        self.actions.extend([self.list_window_action, self.select_window_action])
        
        # Адреса экшенов списка
        self.new_grid_window_action  = ListNewRowWindowAction()
        self.edit_grid_window_action = ListEditRowWindowAction()
        self.save_row_action         = ListSaveRowAction()
        self.delete_row_action       = ListDeleteRowAction()
        self.actions.extend([self.new_grid_window_action, 
                             self.edit_grid_window_action,
                             self.save_row_action, 
                             self.delete_row_action])
        
        # Драг&Дроп
        self.drag_tree = TreeDragAndDropAction()
        self.drag_list = ListDragAndDropAction()
        self.actions.extend([self.drag_tree, self.drag_list])
        
        # Адреса экшенов дерева
        self.new_node_window_action  = TreeNewNodeWindowAction()
        self.edit_node_window_action = TreeEditNodeWindowAction()
        self.save_node_action        = TreeSaveNodeAction()
        self.delete_node_action      = TreeDeleteNodeAction()
        self.actions.extend([self.new_node_window_action, 
                             self.edit_node_window_action,
                             self.save_node_action, 
                             self.delete_node_action])
    
    #========================== ДЕРЕВО ===========================
    
    def get_nodes(self, parent_id, filter):
        raise NotImplementedError()
    
    def get_node(self, id):
        raise NotImplementedError()
    
    def validate_node(self, obj, request):
        pass
    
    def save_node(self, obj, parent_id):
        raise NotImplementedError()
    
    def delete_node(self, obj):
        raise NotImplementedError()
    
    #================ ФУНКЦИИ ВОЗВРАЩАЮЩИЕ АДРЕСА ===============
    
    def get_select_url(self):
        ''' Возвращает адрес формы списка элементов справочника. '''
        return self.select_window_action.get_absolute_url()
    
    def get_list_url(self):
        ''' Возвращает адрес формы списка элементов справочника. '''
        return self.list_window_action.get_absolute_url()
    
    def get_edit_url(self):
        ''' Возвращает адрес формы редактирования элемента справочника. '''
        return self.edit_grid_window_action.get_absolute_url()
    
    def get_edit_node_url(self):
        ''' Возвращает адрес формы редактирования группы справочника. '''
        return self.edit_node_window_action.get_absolute_url()
    
    def get_rows_url(self):
        ''' Возвращает адрес по которому запрашиваются элементы грида. '''
        return self.rows_action.get_absolute_url()
    
    def get_nodes_url(self):
        ''' Возвращает адрес по которому запрашиваются группы дерева. '''
        return self.nodes_action.get_absolute_url()
        
    def get_nodes_like_rows_url(self):
        ''' Возвращает адрес по которому запрашиваются группы дерева как список '''
        return self.nodes_like_rows_action.get_absolute_url()
    
    #=================== ИЗМЕНЕНИЕ ДАННЫХ =======================
    
    def get_rows(self, offset, limit, filter, parent_id):
        raise NotImplementedError()
    
    def get_row(self, id):
        raise NotImplementedError()
    
    def validate_row(self, obj, request):
        pass
    
    def save_row(self, obj, parent_id):
        raise NotImplementedError()
    
    def delete_row(self, obj):
        raise NotImplementedError()
    
    #============ ДЛЯ ИЗМЕНЕНИЯ ОКОН ВЫБОРА НА ХОДУ ==============
    
    def get_select_window(self, win):
        return win
    
    def get_list_window(self, win):
        return win
    
    #======================= Drag&Drop ===========================
    
    def drag_node(self, id, dest_id):
        raise NotImplementedError()
    
    def drag_item(self, id, dest_id):
        raise NotImplementedError()
    
    #============ ДЛЯ ИЗМЕНЕНИЯ ОКОН РЕДАКТИРОВАНИЯ НА ХОДУ ======
    
    def get_edit_window(self, win):
        return win
    
    def get_node_edit_window(self, win):
        return win 

class BaseTreeDictionaryModelActions(BaseTreeDictionaryActions):
    '''
    Класс реализует действия над иерархическим справочником, основанном на моделе
    '''
    # Признак возвращения всех узлов дерева
    ALL_ROWS = -1
    
    # Поля для поиска по умолчанию.
    DEFAULT_FILTER_FIELDS = ['code', 'name']
    
    # Настройки для модели дерева
    tree_model = None # Сама модель дерева
    tree_filter_fields = [] # Поля по которым производится поиск в дереве
    tree_columns = [] # Список из кортежей с параметрами выводимых в дерево колонок
    tree_parent_field = 'parent' # Имя поля ссылающегося на группу
    tree_readonly = False # Если истина, то адреса экшенов дереву не назначаются
    tree_order_field = ''
    
    # Настройки модели списка
    list_model = None # Не обязательная модель списка связанного с деревом
    list_columns = [] # Список из кортежей с параметрами выводимых в грид колонок
    filter_fields = [] # Поля по которым производится поиск в списке
    list_parent_field = 'parent' # Имя поля ссылающегося на группу
    list_readonly = False # Если истина, то адреса экшенов гриду не назначаются
    list_order_field = ''
    list_paging = True
    
    # Порядок сортировки элементов списка. Работает следующим образом:
    # 1. Если в list_columns модели списка есть поле code, то устанавливается сортировка по возрастанию этого поля;
    # 2. Если в list_columns модели списка нет поля code, но есть поле name, то устанавливается сортировка по возрастанию поля name;
    # Пример list_sort_order = ['code', '-name']
    list_sort_order = []
    tree_sort_order = None
    
    def __init__(self):
        super(BaseTreeDictionaryModelActions, self).__init__()
        # Установка значений по умолчанию для поиска и сортировки
        if self.list_model:
            self.filter_fields = self._default_list_search_filter()
            self.list_sort_order = self._default_order()
        if self.tree_model:
            self.tree_filter_fields = self._default_tree_search_filter()
    
    def get_nodes(self, request, context, parent_id, filter, branch_id = None):
        '''
        Метод получения списка узлов дерева, которые 
        '''
        # parent_id - это элемент, который раскрывается, поэтому для него фильтр ставить не надо, иначе фильтруем
        # branch_id - это элемент ограничивающий дерево, т.е. должны возвращаться только дочерние ему элементы
        if filter and not parent_id:
            filter_dict = utils.create_search_filter(filter, self.tree_filter_fields)
            nodes = utils.fetch_search_tree(self.tree_model, filter_dict, branch_id)
        else:
            if branch_id and hasattr(self.tree_model,'get_descendants'):
                branch_node = self.tree_model.objects.get(id = branch_id)
                if parent_id:
                    query = branch_node.get_descendants().filter(parent = parent_id)
                else:
                    query = branch_node.get_children()
            else:
                query = self.tree_model.objects.filter(parent = parent_id)
            query = utils.apply_sort_order(query, self.tree_columns, self.tree_sort_order)
            
            # кастомная функция модификации запроса
            # при реализации контестных справочников в большинстве случаев
            # достаточно будет просто переопределить данную функцию  
            query = self.modify_get_nodes(query, request, context)
            
            nodes = list(query)       
            # Если имеем дело с листом, нужно передавать параметр leaf = true
            for node in nodes:
                if self.tree_model.objects.filter(parent = node.id).count() == 0:
                    node.leaf = 'true'
                    
        # генерируем сигнал о том, что узлы дерева подготовлены
        nodes_prepared.send(sender = self.__class__, nodes = nodes)
        return nodes
    
    def modify_get_nodes(self, query, request, context):
        '''
        '''
        return query
    
    def get_rows(self, request, context, parent_id, offset, limit, filter):
        # если справочник состоит только из дерева и у него просят запись, то надо брать из модели дерева
        #TODO: возможно это не надо было делать - раз не туда обратились, значит сами виноваты
        if self.list_model:
            query = None
            if parent_id == BaseTreeDictionaryModelActions.ALL_ROWS:
                # отображаются все данные
                query = self.list_model.objects 
            else:
                # отображаются данные с фильтрацией по значению parent_id
                query = self.list_model.objects.filter(**{self.list_parent_field: parent_id})
            
            # Подтягиваем группу, т.к. при сериализации она требуется
            query = query.select_related(self.list_parent_field)
            query = utils.apply_sort_order(query, self.list_columns, self.list_sort_order)
            query = utils.apply_search_filter(query, filter, self.filter_fields)
            # Для работы пейджинга нужно передавать общее количество записей
            query = self.modify_get_rows(query, request, context)
            total = query.count()
            # Срез данных для страницы
            if limit > 0:
                query = query[offset: offset + limit]
            
            result = {'rows': list(query.all()), 'total': total}
            return result
        else:
            return self.get_nodes(parent_id, filter)

    def modify_get_rows(self, query, request, context):
        '''
        метод для переопределения запроса на получение данных справочника
        '''
        return query

    def _get_model_fieldnames(self, model):
        """ Возвращает имена всех полей модели """ 
        return [field.attname for field in model._meta.local_fields]
    
    def _default_order(self):
        '''
        Устанавливаем параметры сортировки по умолчанию 'code' и 'name' в случае, 
        если у модели есть такие поля
        '''
        filter_order = self.list_sort_order                    
        if not filter_order:
            filter_order = []  
            all_fields = self._get_model_fieldnames(self.list_model)
            filter_order.extend([field for field in ('code', 'name', 'id')\
                                 if field in all_fields ])
        return filter_order
    
    def _default_tree_search_filter(self):
        """ Если поля для поиска не заданы, то возвращает список из полей модели
            по которым будет производиться поиск. По умолчанию берутся код и наименование """
        if not self.tree_filter_fields:
            assert self.tree_model, 'Tree model is not defined!'
            for field_name in self._get_model_fieldnames(self.tree_model):
                if field_name in self.DEFAULT_FILTER_FIELDS:
                    self.tree_filter_fields.append(field_name)

        return self.tree_filter_fields
    
    def _default_list_search_filter(self):
        """ Если поля для поиска не заданы, то возвращает список из полей модели
            по которым будет производиться поиск. По умолчанию берутся код и наименование """
        if not self.filter_fields:
            assert self.list_model, 'List model is not defined!'
            for field_name in self._get_model_fieldnames(self.list_model):
                if field_name in self.DEFAULT_FILTER_FIELDS:
                    self.filter_fields.append(field_name)

        return self.filter_fields
    
    def get_nodes_like_rows(self, request, context, filter, branch_id = None):
        '''
        Возвращаются узлы дерева, предствленные в виде общего списка
        '''
        # branch_id - это элемент ограничивающий дерево, т.е. должны возвращаться только дочерние ему элементы
        if filter:
            filter_dict = utils.create_search_filter(filter, self.tree_filter_fields)
            if branch_id and hasattr(self.tree_model,'get_descendants'):
                branch_node = self.tree_model.objects.get(id = branch_id)
                nodes = branch_node.get_descendants().filter(filter_dict).select_related('parent')
            else:
                nodes = self.tree_model.objects.filter(filter_dict).select_related('parent')
        else:
            if branch_id and hasattr(self.tree_model,'get_descendants'):
                branch_node = self.tree_model.objects.get(id = branch_id)
                nodes = branch_node.get_descendants()
            else:
                nodes = self.tree_model.objects
        # кастомная функция модификации запроса
        # при реализации контестных справочников в большинстве случаев
        # достаточно будет просто переопределить данную функцию  
        nodes = self.modify_get_nodes(nodes, request, context)            
        # Для работы пейджинга нужно передавать общее количество записей
        total = len(nodes)  
        result = {'rows': list(nodes), 'total': total}
        return result 
    
    def _get_obj(self, model, id):
        '''
        Возвращает запись заданной модели model по id
        Если id нет, значит нужно создать новый объект
        '''
        assert isinstance(id, int)
        if id == 0:
            obj = model()
        else:
            try:
                obj = model.objects.get(id = id)
            except model.DoesNotExist:
                return None
        return obj
    
    def get_node(self, id = 0):
        return self._get_obj(self.tree_model, id)
    
    def get_row(self, id = 0):
        # если справочник состоит только из дерева и у него просят запись, то надо брать из модели дерева
        #TODO: это надо было для элемента выбора из справочника - он не знает откуда ему взять запись и всегда вызывает get_row. может надо было как-то по-другому это решить
        if self.list_model:
            return self._get_obj(self.list_model, id)
        else:
            return self.get_node(id)
    
    def save_row(self, obj):
        obj.save()
        return OperationResult(success = True)
    
    def save_node(self, obj):
        obj.save()
        return OperationResult(success = True)
    
    def delete_row(self, objs):
        # Такая реализация обусловлена тем, что IntegrityError невозможно отловить
        # до завершения транзакции, и приходится оборачивать транзакцию.
        @transaction.commit_on_success
        def delete_row_in_transaction(self, objs):
            message = ''
            if len(objs) == 0:
                message = u'Элемент не существует в базе данных.'
            else:
                for obj in objs:
                    if (isinstance(obj, BaseObjectModel) or 
                        (hasattr(obj, 'safe_delete') and callable(obj.safe_delete))):
                        try:
                            obj.safe_delete()
                        except RelatedError, e:
                            message = e.args[0]
                    else:
                        if not safe_delete(obj):
                            message = u'Не удалось удалить элемент %s. Возможно на него есть ссылки.' % obj.id
                            break
            return OperationResult.by_message(message)
        # Тут пытаемся поймать ошибку из транзакции.
        try:
            return delete_row_in_transaction(self, objs)
        except Exception, e:
            # Встроенный в Django IntegrityError не генерируется. Кидаются исключения
            # специфичные для каждого драйвера БД. Но по спецификации PEP 249 все они
            # называются IntegrityError
            if e.__class__.__name__ == 'IntegrityError':
                message = u'Не удалось удалить элемент. Возможно на него есть ссылки.'
                return OperationResult.by_message(message)
            else:
                # все левые ошибки выпускаем наверх
                raise

    def delete_node(self, obj):
        '''
        Удаление группы справочника.
        Нельзя удалять группу если у нее есть подгруппы или если в ней есть элементы.
        Но даже после этого удалять группу можно только прямым запросом, т.к. 
        мы не знаем заранее кто на нее может ссылаться и кого зацепит каскадное удаление джанги.
        '''
        message = ''
        if obj == None:
            message = u'Группа не существует в базе данных.'
        elif self.tree_model.objects.filter(**{self.tree_parent_field: obj}).count() > 0:
            message = u'Нельзя удалить группу содержащую в себе другие группы.'
        elif self.list_model and self.list_model.objects.filter(**{self.list_parent_field: obj}).count() > 0:
            message = u'Нельзя удалить группу содержащую в себе элементы.'
        elif not safe_delete(obj):
            message = u'Не удалось удалить группу. Возможно на неё есть ссылки.'
            
        return OperationResult.by_message(message)
        
    def drag_node(self, id, dest_id):
        node = self.get_node(id)
        # Если id узла на который кидаем <1, значит это корень справочника
        if dest_id < 1:
            node.parent_id = None
        else:
            node.parent_id = dest_id
        node.save()
        return OperationResult()
    
    def drag_item(self, ids, dest_id):
        # В корень нельзя кидать простые элементы
        if dest_id < 1:
            return OperationResult.by_message(u'Нельзя перемещать элементы в корень справочника!')
        
        # Из грида в дерево одновременно могут быть перенесены несколько элементов
        # Их id разделены запятыми
        for id in ids:
            row = self.get_row(id)
            row.parent_id = dest_id
            row.save()
        return OperationResult()
    
#=#===============================================================================
# Сигналы, который посылаются в процессе работы подсистемы древовидных справочника
#===============================================================================

# сигнал о том, что узлы дерева иерархического справочника подготовлены
nodes_prepared = Signal(providing_args = ['nodes'])
    
#TODO: Избавиться от копипаста в экшенах.
#TODO: Написать о себе статью в википедии ;)
