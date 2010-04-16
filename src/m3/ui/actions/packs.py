#coding:utf-8
from m3.ui.actions import ActionPack, Action, ExtUIScriptResult, PreJsonResult, OperationResult
from m3.ui.ext.windows.complex import ExtDictionaryWindow
from m3.ui.ext.misc.store import ExtJsonStore
from django.db import transaction
from django.db.models.query_utils import Q
from m3.ui.actions.utils import apply_search_filter

class DictListWindowAction(Action):
    '''
    Действие, которое возвращает окно со списком элементов справочника.
    '''
    url = '/list-window$'
    def run(self, request, context):
        base = self.parent
        win = base.list_form(mode = 0, title = base.title)
        
        # Добавляем отображаемые колонки
        for field, name in base.list_columns:
            win.grid.add_column(header = name, data_index = field)
        
        # Устанавливаем источники данных
        grid_store = ExtJsonStore(url = base.rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(grid_store)
        
        # Доступны 3 события: создание нового элемента, редактирование или удаление имеющегося 
        win.url_new    = base.edit_window_action.get_absolute_url()
        win.url_edit   = base.edit_window_action.get_absolute_url()
        win.url_delete = base.delete_action.get_absolute_url()
        
        return ExtUIScriptResult(self.parent.get_list_window(win))
    
class DictSelectWindowAction(Action):
    '''
    Действие, возвращающее окно с формой выбора из справочника
    '''
    url = '/select-window$'
    def run(self, request, context):
        # Создаем окно выбора
        base = self.parent
        win = base.select_form(title = base.title)
        win.mode = 1
        
        # Добавляем отображаемые колонки
        for field, name in base.list_columns:
            win.grid.add_column(header = name, data_index = field)
            
        # Устанавливаем источник данных
        grid_store = ExtJsonStore(url = base.rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(grid_store)
        list_store = ExtJsonStore(url = base.last_used_action.get_absolute_url(), auto_load = False)
        win.list_view.set_store(list_store)
        
        return ExtUIScriptResult(self.parent.get_select_window(win))
    
class DictEditWindowAction(Action):
    '''
    Редактирование элемента справочника
    '''
    url = '/edit-window$'
    def run(self, request, context):
        base = self.parent
        # Получаем объект по id
        id = request.REQUEST.get('id')
        obj = self.parent.get_row(id)
        # Разница между новый и созданным объектов в том, что у нового нет id или он пустой
        create_new = True
        if isinstance(obj, dict) and obj.get('id') != None:
            create_new = False
        elif hasattr(obj, 'id') and getattr(obj, 'id') != None:
            create_new = False
        # Устанавливаем параметры формы
        win = self.parent.edit_window(create_new = create_new, title = base.title)
        # Биндим объект к форме
        win.form.from_object(obj)
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
        offset = int(request.REQUEST.get('offset', 0))
        limit = int(request.REQUEST.get('limit', 0))
        filter = request.REQUEST.get('filter')
        return PreJsonResult(self.parent.get_rows(offset, limit, filter))
    
class DictLastUsedAction(Action):
    '''
    Действие, которое возвращает список последних использованных действий
    '''
    url = '/last-rows$'
    def run(self, request, context):
        return PreJsonResult(self.parent.get_last_used(self))
    
class DictRowAction(Action):
    '''
    Действие, которое отвечает за возврат данных для одного отдельно-взятой записи справочника
    '''
    url = '/item$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        result = self.parent.get_row(self, id)
        return PreJsonResult(result)

class DictSaveAction(Action):
    '''
    Действие выполняет сохранение записи справочника.
    '''
    url = '/save$'
    def run(self, request, context):
        # Создаем форму для биндинга к ней
        win = self.parent.edit_window()
        win.form.bind_to_request(request)
        # Получаем наш объект по id
        id = request.REQUEST.get('id')
        obj = self.parent.get_row(id)
        # Биндим форму к объекту
        win.form.to_object(obj)
        return self.parent.save_row(obj)
    
class DictDeleteAction(Action):
    '''
    Действие удаления записи из справочника
    '''
    url = '/delete$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        obj = self.parent.get_row(id)
        return self.parent.delete_row(obj)

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
    list_form    = ExtDictionaryWindow
    select_form  = ExtDictionaryWindow
    
    def __init__(self):
        # В отличие от обычных паков в этом экшены создаются самостоятельно, а не контроллером
        # Чтобы было удобно обращаться к ним по имени
        self.list_window_action   = DictListWindowAction()
        self.select_window_action = DictSelectWindowAction()
        self.edit_window_action   = DictEditWindowAction()
        self.rows_action          = DictRowsAction()
        self.last_used_action     = DictLastUsedAction()
        self.row_action           = DictRowAction()
        self.save_action          = DictSaveAction()
        self.delete_action        = DictDeleteAction()
        # Но привязать их все равно нужно
        self.actions = [self.list_window_action, self.list_window_action, self.edit_window_action,\
                        self.rows_action, self.last_used_action, self.row_action, self.save_action,\
                        self.delete_action]
    
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
        return self.list_window_action.get_absolute_url()
    
    def get_rows(self, offset, limit, filter):
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
    
    def get_list_window(self, win):
        ''' Возвращает настроенное окно типа "Список" справочника '''        
        return win
    
    def get_select_window(self, win):
        ''' Возвращает настроенное окно выбора из справочника '''
        return win
    
    def get_edit_window(self, win):
        ''' Возвращает настроенное окно редактирования элемента справочника '''
        return win
    
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

class BaseDictionaryModelActions(BaseDictionaryActions):
    '''
    Класс, который реализует действия со справочником, записи которого являются моделями.
    '''
    # Настройки вида справочника (задаются конечным разработчиком)
    model = None
    filter_fields = []
        
    def get_rows(self, offset, limit, filter):
        '''
        Возвращает данные для грида справочника
        '''
        #TODO: Пока нет грида с пейджингом старт и оффсет не работают
        query = apply_search_filter(self.model.objects, filter, self.filter_fields)
        items = list(query.all())
        return items
    
    def get_row(self, id):
        # Если id нет, значит нужно создать новый объект
        if (id == None) or (len(id) == 0):
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
    
    @transaction.commit_on_success
    def delete_row(self, obj):
        obj.delete()
        return OperationResult(success = True)
