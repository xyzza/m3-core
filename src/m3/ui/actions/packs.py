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
        return ExtUIScriptResult(self.parent.get_edit_window())
    
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
        return PreJsonResult(self.parent.get_row(self))

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
        
    def get_rows(self, start, offset, filter):
        raise NotImplementedError()
    
    def get_row(self, id):
        raise NotImplementedError()
    
    def get_last_used(self):
        raise NotImplementedError()
    
    def get_list_window(self):
        raise NotImplementedError()
    
    def get_select_window(self):
        raise NotImplementedError()
    
    def get_edit_window(self):
        raise NotImplementedError()
    
    def save_row(self, obj):
        raise NotImplementedError()
    
    def delete_row(self, obj):
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
        #TODO: С формой тоже шляпа, ее нужно настраивать, присваивать урлы
        win = ExtDictionaryWindow(title = self.title)
        # Добавляем отображаемые колонки
        for field, name in self.list_columns:
            win.grid.add_column(header = name, data_index = field)
        # Устанавливаем источник данных
        store = ExtJsonStore(url = self.rows_action.get_absolute_url(), auto_load = True)
        win.grid.set_store(store)
        # Действия кнопок
        
        return win
    
    def get_rows(self, start = 0, offset = 0, filter = ''):
        '''
        Возвращает данные для грида справочника
        '''
        #TODO: Пока нет грида с пейджингом старт и оффсет не работают
        items = list(self.model.objects.all())
        return items
    
    