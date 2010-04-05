#coding:utf-8
from m3.ui.actions import ActionPack, Action, ExtUIScriptResult, PreJsonResult,\
    ExtUIComponentResult
from m3.ui.ext.windows.complex import ExtDictionaryWindow
from m3.ui.ext.misc.store import ExtJsonStore

class DictListWindowAction(Action):
    '''
    Действие, которое возвращает окно со списком элементов справочника.
    '''
    url = '/list-window$'
    def run(self, request, context):
        return ExtUIScriptResult(self.parent.get_list_window())
    
class DictSelectWindowAction(Action):
    '''
    Действие, возвращающее окно с формой выбора из справочника
    '''
    url = '/select-window$'
    def run(self, request, context):
        return ExtUIScriptResult(self.parent.get_select_window())
    
class DictEditWindowAction(Action):
    '''
    Редактирование элемента справочника
    '''
    url = '/edit-window$'
    def run(self, request, context):
        id = request.REQUEST.get('id')
        return ExtUIScriptResult(self.parent.get_edit_window(id))
    
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
        return PreJsonResult(self.parent.get_rows(self))
    
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
        id = request.POST.get('id')
        result = self.parent.get_row(self, id)
        return PreJsonResult(result)

class DictSaveAction(Action):
    '''
    Действие выполняет сохранение записи справочника.
    '''
    url = '/save$'
    def run(self, request, context):
        return ExtUIComponentResult(self.parent.save_row(self))
    
class DictDeleteAction(Action):
    '''
    Действие удаления записи из справочника
    '''
    url = '/delete$'
    def run(self, request, context):
        return ExtUIComponentResult(self.parent.delete_row(self))

class BaseDictionaryActions(ActionPack):
    '''
    Пакет с действиями, специфичными для работы со справочниками
    '''
    
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
        self.actions = [self.list_window_action, self.select_window_action, self.edit_window_action,\
                        self.rows_action, self.last_used_action, self.row_action, self.save_action,\
                        self.delete_action]
    
    def get_list_window_url(self):
        '''
        Возвращает адрес формы списка элементов справочника. 
        Используется для присвоения адресов в прикладном приложении.
        '''
        return self.list_window_action.get_absolute_url()
    
    def get_select_window_url(self):
        '''
        Возвращает адрес формы списка элементов справочника. 
        Используется для присвоения адресов в прикладном приложении.
        '''
        return self.select_window_action.get_absolute_url()
    
    def get_rows(self, start, offset, filter):
        '''
        Метод который возвращает записи грида в втде обычного питоновского списка.
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
    
    def get_list_window(self):
        ''' Возвращает настроенное окно справочника '''
        raise NotImplementedError()
    
    def get_select_window(self):
        ''' Возвращает настроенное окно выбора из справочника '''
        raise NotImplementedError()
    
    def get_edit_window(self):
        ''' Возвращает настроенное окно редактирования элемента справочника '''
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

class BaseDictionaryModelActions(BaseDictionaryActions):
    '''
    Класс, который реализует действия со справочником, записи которого являются моделями.
    '''
    # Настройки вида справочника (задаются конечным разработчиком)
    model = None
    title = ''
    list_columns = []
    edit_windows = None
    filter_fields = []
    
    def get_list_window(self):
        '''
        Создает и настраивает окно справочника вида "Список"
        '''
        win = ExtDictionaryWindow(mode = 0, title = self.title)
        
        # Добавляем отображаемые колонки
        for field, name in self.list_columns:
            win.grid.add_column(header = name, data_index = field)
        
        # Устанавливаем источники данных
        grid_store = ExtJsonStore(url = self.rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(grid_store)
        
        #TODO: Настроить урлы на форме
        # Доступны 3 события: создание нового элемента, редактирование или удаление имеющегося
        #win.set_new_menu_handler(self.edit_window_action.get_absolute_url())
        #win.set_edit_menu_handler(self.edit_window_action.get_absolute_url())
        #win.set_delete_menu_handler(self.delete_action.get_absolute_url())
        
        return win
    
    def get_rows(self, start = 0, offset = 0, filter = ''):
        '''
        Возвращает данные для грида справочника
        '''
        #TODO: Пока нет грида с пейджингом старт и оффсет не работают
        items = list(self.model.objects.all())
        return items
    
    def get_row(self, id):
        try:
            record = self.model.objects.get(id = id)
        except self.model.DoesNotExist:
            return None
        return record
    
    def save_row(self, obj):
        obj.save()
        
    def delete_row(self, obj):
        obj.delete()
    
    def get_edit_window(self, id):
        record = self.get_row(id)
        win = self.edit_windows()
        win.form.from_object(record)
        win.url_save = self.save_action.get_absolute_url()
        
        