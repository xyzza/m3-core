#coding:utf-8
from m3.ui.actions import ActionPack, Action, ExtUIScriptResult
from m3.ui.ext.windows.window import ExtWindow

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
    url = '/row$'
    
class DictLastUsedAction(Action):
    '''
    Действие, которое возвращает список последних использованных действий
    '''
    url = '/last-rows$'
    
class DictRowAction(Action):
    '''
    Действие, которое отвечает за возврат данных для одного отдельно-взятой записи справочника
    '''
    url = '/item$'

class DictSaveAction(Action):
    '''
    Действие выполняет сохранение записи справочника.
    '''
    url = '/save$'
    
class DictDeleteAction(Action):
    '''
    Действие удаления записи из справочника
    '''
    url = '/delete$'

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
        '''
        '''
        pass
    
    def get_row(self, id):
        '''
        '''
        pass
    
    def get_last_used(self):
        '''
        '''
        pass
    
    def get_list_window(self):
        '''
        '''
        win = ExtWindow(title = u'Окно списка')
        return win
    
    def get_select_window(self):
        '''
        '''
        pass
    
    def get_edit_window(self):
        '''
        '''
        pass
    
    def save_row(self, obj):
        '''
        '''
        pass
    
    def delete_row(self, obj):
        '''
        '''
        pass

class BaseDictionaryModelActions(BaseDictionaryActions):
    '''
    Класс, который реализует действия со справочником, записи которого являются моделями.
    '''    
    model = None
    list_columns = []
    edit_windows = None
    filter_fields = []

