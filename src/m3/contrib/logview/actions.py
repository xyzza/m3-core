#coding:utf-8
'''
Created on 24.08.2010

@author: kir
'''

from m3.ui.actions import ActionPack, Action, ExtUIScriptResult
from m3.ui.actions.context import ActionContextDeclaration
from m3.contrib.logview import forms
from m3.contrib.logview import helpers as admin_helpers
from m3.ui.ext.misc.store import ExtDataStore
from m3.ui.actions.results import JsonResult, OperationResult, PreJsonResult
import datetime
    
class LogsAction(Action):
    '''
    Выводит наименование имеющихся файлов логирования
    '''
    url = '/logs'
    
    def run(self, request, context):
        window_params = {
            'get_logs_url': self.parent.GetLogsAction.get_absolute_url(),
            'logs_list_by_date_url': self.parent.LogsDateChangeAction.get_absolute_url()
        }
        window_params.update(context.__dict__)
        
        win = forms.ExtLogsWindow(window_params)
        logs_store = ExtDataStore(admin_helpers.log_files_list())
        win.logFilesCombo.set_store(logs_store)
        return ExtUIScriptResult(win)

class LogsDateChangeAction(Action):
    '''
    Получает список лог файлов по дате
    '''
    url = '/logs-by-date'
    
    def context_declaration(self):
        return [ActionContextDeclaration('date', default='', type=str, required=True)]
    def run(self, request, context):
        actual_date = datetime.datetime.strptime(context.date,'%Y-%m-%d').date()
        if actual_date == datetime.date.today():
            return PreJsonResult(admin_helpers.log_files_list())
        logs = admin_helpers.log_files_list(context.date)
        return PreJsonResult(logs)
    
class GetLogsAction(Action):
    '''
    Получает файл логирования
    '''
    url = '/get-logs-file'
    
    def context_declaration(self):
        return [ActionContextDeclaration('filename', default='', type=str, required=True)]
        
    def run(self, request, context):
        if request.POST.get('filename'):
            file_content = admin_helpers.get_log_content(context.filename)
            return JsonResult(file_content)
        return OperationResult.by_message('Ошибка при попытке чтения файла')

class Mis_Admin_ActionsPack(ActionPack):
    '''
    Набор действий для работы с административной панелью
    '''
    def __init__(self):
        super(self.__class__,self).__init__()
        self.LogsAction = LogsAction()
        self.GetLogsAction = GetLogsAction()
        self.LogsDateChangeAction = LogsDateChangeAction()
        
        self.actions = [ self.LogsAction, self.GetLogsAction
                        ,self.LogsDateChangeAction]