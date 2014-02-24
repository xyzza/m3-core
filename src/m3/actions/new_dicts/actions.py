#coding: utf-8

from m3_ext.ui.results import ExtUIScriptResult
from m3.actions import Action, PreJsonResult, ACD, OperationResult
from m3.db import BaseEnumerate


class ActionFactory(object):

    _list_action = None
    _edit_action = None
    _save_action = None
    _rows_action = None
    _delete_action = None
    _select_action = None
    _load_action = None
    _visitor = None

    def get_list_action(self):
        assert self.list_action, u"Provide list action"
        self._list_action = self.list_action()
        return self._list_action

    def get_select_action(self):
        assert self.select_action, u"Provide select action"
        self._select_action = self.select_action()
        return self._select_action

    def get_edit_action(self):
        assert self.edit_action, u"Provide edit action"
        self._edit_action = self.edit_action()
        return self._edit_action

    def get_rows_action(self):
        assert self.rows_action, u"Provide rows action"
        self._rows_action = self.rows_action()
        return self._rows_action

    def get_save_action(self):
        assert self.save_action, u"Provide save action"
        self._save_action = self.save_action()
        return self._save_action

    def get_delete_action(self):
        assert self.delete_action, u"Provide delete action"
        self._delete_action = self.delete_action()
        return self._delete_action

    def get_load_action(self):
        assert self.load_action, u"Provide load action"
        self._load_action = self.load_action()
        return self._load_action

    @property
    def visitor(self):
        return self._visitor()

    def create(self, *args, **kwargs):

        actions = [
            self.get_list_action(*args, **kwargs),
            self.get_edit_action(*args, **kwargs),
            self.get_save_action(*args, **kwargs),
            self.get_rows_action(*args, **kwargs),
            self.get_delete_action(*args, **kwargs),
            self.get_load_action(*args, **kwargs),
            self.get_select_action(*args, **kwargs)
        ]

        return actions

    def adapt(self, pack):

        pack.list_window_action = self._list_action
        pack.edit_window_action = self._edit_action
        pack.save_action = self._save_action
        pack.rows_action = self._rows_action
        pack.delete_action = self._delete_action
        pack.load_action = self._load_action
        pack.select_window_action = self._select_action


class ActionModeEnum(BaseEnumerate):

    SCRIPT, DATA = range(1, 3)
    values = {
        DATA: u'данные',
        SCRIPT: u'скрипт'
    }


class UiDataAction(Action):
    """Базовый экшен для работы с паком
    """
    visitor = None
    override_mode = None

    class NotExistedMode(Exception):
        pass

    class VisitorNotProvided(Exception):
        pass

    def context_declaration(self):
        return [
            ACD(name="mode", type=int, required=False, default=ActionModeEnum.DATA)
        ]

    def __init__(self, **kwargs):
        if not self.url.startswith("/"):
            self.url = "/" + self.url
        super(UiDataAction, self).__init__(**kwargs)

    def accept(self, visitor, *args):
        raise NotImplementedError()

    def eval(self, action_mode, request, context):
        visitor = self.visitor
        if not visitor:
            raise self.VisitorNotProvided("Visitor for action not provided!")

        action_mode = self.override_mode or action_mode
        window, data = self.accept(self.visitor, *(request, context))

        #проверка при выполнении действия возратила ошибку
        if data and data.get('errors', None):
            result = OperationResult.by_message(u"\r\n".join(data['errors']))
            return result

        if action_mode == ActionModeEnum.SCRIPT:
            result = ExtUIScriptResult(window)
        elif action_mode == ActionModeEnum.DATA:
            result = PreJsonResult(data)
        else:
            raise self.NotExistedMode()

        return result

    def run(self, request, context):

        mode = getattr(context, 'mode', 2)
        if hasattr(context, 'mode'):
            delattr(context, 'mode')
        return self.eval(mode, request, context)


class ActionModeEnum(BaseEnumerate):

    SCRIPT, DATA = range(1, 3)

    values = {
        DATA: u'данные',
        SCRIPT: u'код'
    }


class ListAction(UiDataAction):
    """экшен получения окна просмотра/выбора
    """
    url = r"list_window"
    override_mode = ActionModeEnum.SCRIPT

    def accept(self, visitor, *args):
        return visitor.bind_to_store(self.parent, True, False, *args)


class SelectAction(UiDataAction):
    """экшен получения окна выбора
    """
    url = r"select_window"
    override_mode = ActionModeEnum.SCRIPT

    def accept(self, visitor, *args):
        return visitor.bind_to_store(self.parent, True, True, *args)


class ListRowsAction(UiDataAction):
    """экшен получения данных из справочника
       связывание данных и представления
    """
    url = r"rows"
    def accept(self, visitor, *args):
        return visitor.bind_to_store(self.parent, False, False, *args)


class SaveFormAction(UiDataAction):
    """экшен сохранения данных в справочник
    """
    url = r"save"
    def accept(self, visitor, *args):
        return visitor.bind_to_model(self.parent, True, *args)


class DeleteAction(UiDataAction):
    """экшен удаления данных из справочника
    """
    url = r"delete"
    def accept(self, visitor, *args):
        return visitor.bind_to_model(self.parent, False, *args)


class EditAction(UiDataAction):
    """экшен биндинга (получения) окна редактирования
    """
    url = r'edit'
    override_mode = ActionModeEnum.SCRIPT

    def accept(self, visitor, *args):
        return visitor.bind_to_window(self.parent, True, *args)


class LoadFormData(UiDataAction):
    """загрузка данных в окно
    """
    url = r'load'
    def accept(self, visitor, *args):
        return visitor.bind_to_window(self.parent, False,*args)




class BaseDictActionFactory(ActionFactory):
    """Конкретная фабрика на экшены для пака
    """
    list_action = ListAction
    edit_action = EditAction
    save_action = SaveFormAction
    rows_action = ListRowsAction
    load_action = LoadFormData
    delete_action = DeleteAction
    select_action = SelectAction

    def __init__(self):
        super(BaseDictActionFactory, self).__init__()
