#coding:utf-8
import json

from m3.contrib.m3_sandbox.models import SandboxAccount, SandboxUser
from m3.contrib.m3_sandbox.ui import SandboxAccountsWindow, EditAccountUserWindow
from m3.ui.actions import ActionPack, Action
from m3.ui.actions.context import ActionContextDeclaration
from m3.ui.actions.packs import BaseDictionaryModelActions
from m3.ui.actions.results import OperationResult, JsonResult, ExtUIScriptResult
from django.contrib.auth import models as django_auth_models

__author__ = 'ZIgi'

#TODO Сейчас можно привязать пользователя к нескольким аккаунтам, что неправильно
#TODO В ui есть ошибки
#TODO или из чернового варианта сделать нормальный или же согласовать с проектом scss

class AccountsManagementPack(BaseDictionaryModelActions):
    url = '/sandbox-accounts'
    model = SandboxAccount
    edit_window = SandboxAccountsWindow
    list_columns =  [('name', u'Наименование')]
    title = u'Учетные записи'

    def __init__(self):
        super(AccountsManagementPack, self).__init__()
        self.actions.extend([ReadAccountUsers,
                             EditAccountUser,
                             CreateAccountUser,
                             DeleteAccountUser,
                             SaveAccountUser])

class ReadAccountUsers(Action):
    url = '/read_account_users'
    shortname = 'read_account_users'

    def context_declaration(self):
        return [ActionContextDeclaration(name='id', required=True, type=int)]

    def run(self, request, context):
        values = SandboxUser.objects.select_related('user').filter(account__id = context.id).values('id',
                                                              'user__username','is_developer')
        result = {'rows': [{
                            'id':x['id'],
                            'name':x['user__username'],
                            'is_developer': u'Да' if x['is_developer'] else u'Нет'}
                            for x in values],
                  'total':len(values)}

        return JsonResult(json.dumps(result))


class EditAccountUser(Action):
    url = '/edit_account_user'
    shortname = 'edit_account_user'

    def context_declaration(self):
        return [ActionContextDeclaration(name='id', required=True, type=int)]

    def run(self, request, context):
        return OperationResult(success=True)


class CreateAccountUser(Action):
    url = '/new_account_user'
    shortname = 'new_account_user'

    def context_declaration(self):
        return [ActionContextDeclaration(name='id', required=True, type=int)]

    def run(self, request, context):
        win = EditAccountUserWindow()
        return ExtUIScriptResult(win)


class DeleteAccountUser(Action):
    url = '/delete_account_user'
    shortname = 'delete_account_user'

    def context_declaration(self):
        return [ActionContextDeclaration(name='account_id', required=True, type=int)]

    def run(self, request, context):
        SandboxUser.objects.get(pk = context.account_id).delete()
        return OperationResult(success=True)


class SaveAccountUser(Action):
    url = '/save_account_user'
    shortname = 'save_account_user'

    def context_declaration(self):
        return [ActionContextDeclaration(name='id', required=True, type=int),
                ActionContextDeclaration(name='user_id', required=True, type=int),
                ActionContextDeclaration(name='is_developer', required=False, type=str, default='off'),]

    def run(self, request, context):
        sandbox_user = SandboxUser()
        sandbox_user.account_id = context.id
        sandbox_user.user_id = context.user_id
        sandbox_user.is_developer = \
        True if hasattr(context,'is_developer') and context.is_developer == 'on' else False
        sandbox_user.save()
        return OperationResult(success=True)

class SelectDjangoUserPack(BaseDictionaryModelActions):
    url = '/select_django_user'
    shortname = 'select_django_user'
    model = django_auth_models.User
    list_columns = [('username', u'Логин')]
    title = u'Выбор пользователя'
    column_name_on_select = 'username'
