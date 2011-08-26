#coding:utf-8

import inspect
import os.path
import sys
from django.conf import settings
from m3.contrib.m3_sandbox.models import SandboxAccount, SandboxUser
from m3.ui.actions import ActionController, Action, ActionPack, ControllerCache
from django.utils.importlib import import_module
from django.conf import settings
from m3.ui.actions.results import ActionResult
from django import http

__author__ = 'ZIgi'

class SandboxAction(Action):
    override_cls = None

    def __init__(self):
        super(SandboxAction, self).__init__()


class SandboxPack(ActionPack):

    def __init__(self):
        super(ActionPack, self).__init__()


class SandboxController(ActionController):

    def __init__(self, url = '', name=None):
        super(SandboxController, self).__init__(url,name)

    def process_request(self, request):
        """
        Обработка входящего запроса *request* от клиента.
        Обрабатывается по аналогии с UrlResolver'ом Django
        """
        ControllerCache.populate()

        path = request.path
        matched = self._url_patterns.get(path)
        if matched:
            stack, action = matched

            if settings.DEBUG:
                # Записывает сообщение в логгер если включен тестовый режим
                try:
                    result = self._invoke(request, action, stack)
                except:
                    raise
            else:
                result = self._invoke(request, action, stack)

            if isinstance(result, ActionResult):
                return result.get_http_response()
            return result

        #self.dump_urls()
        raise http.Http404()

    def _invoke(self, request, action, stack):
        action_to_invoke = SandboxKeeper.get_override_to_action(action, request) or action
        return super(SandboxController, self)._invoke(request, action_to_invoke, stack)

class SandboxKeeper(object):
    _apps_loaded = False
    _sandbox_controllers = {}
    _action_overrides = {}

    @classmethod
    def add_account(cls, account_name):
        cls._accounts_buffer.append(account_name)

    @classmethod
    def get_accounts(cls):
        return map( lambda x: x.name,  list(SandboxAccount.objects.all()))

    @classmethod
    def get_account(cls, request):
        sandbox_user = SandboxUser.objects.filter(user = request.user).select_related('account')
        return sandbox_user[0].account.name if sandbox_user else None
        
    @classmethod
    def get_override_to_action(cls, action, request):
        account = cls.get_account(request)

        if not account:
            return None

        action_path = action.__class__.__module__ + '.' + action.__class__.__name__

        if cls._action_overrides.has_key(account) \
            and cls._action_overrides[account].has_key(action_path):
            return cls._action_overrides[account][action_path]

    @classmethod
    def get_sandbox_controllers(cls):
        if not cls._apps_loaded:
            cls.import_sandbox_apps()
            cls._apps_loaded = True

        return cls._sandbox_controllers

    @classmethod
    def import_sandbox_apps(cls):
        sandbox_apps = SandboxKeeper.get_accounts()

        sys.path.insert(0, settings.SANDBOX_FOLDERS)

        for app in sandbox_apps:
            cls._action_overrides[app] = {}

            controller = SandboxController('/sandbox/' + app)
            generic_pack = ActionPack()
            generic_pack.url = '/generic'

            package = app
            module_name = package + '.actions'

            try:
                module = import_module('.actions', app )
            except ImportError as err:
                continue

            for attr_name in dir(module):
                attr = getattr(module, attr_name)

                #нам не нужны импортированные классы
                if not inspect.isclass(attr) or attr.__module__ != module_name:
                    continue

                if inspect.isclass(attr) and issubclass(attr, SandboxAction) and hasattr(attr,'override'):
                    #TODO проверка что класс который мы оверрайдим существует
                    #TODO вытаскивать из класса родителя урл?
                    new_action = attr()
                    generic_pack.actions.append(new_action) #иначе иксепшен при проверке прав
                    cls._action_overrides[app][attr.override] = new_action

                #паки добавляются в контроллер
                if inspect.isclass(attr) and issubclass( attr, SandboxPack):
                    controller.append_pack( attr() )

            controller.append_pack(generic_pack)
            
            cls._sandbox_controllers[app] = controller