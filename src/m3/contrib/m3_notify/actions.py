#coding:utf-8
from m3.contrib.m3_notify.models import NotifyMessageParentTypeEnum, NotifyTemplate
from m3.contrib.m3_notify.ui import EditNotifyMessageWindow
from m3.ui.actions import ActionPack, Action
from m3.ui.actions.context import ActionContextDeclaration
from m3.ui.actions.results import ExtUIScriptResult, PreJsonResult, OperationResult
from m3.helpers import urls

from api import NotifyManager

from django.db import transaction

from ui import NotifyMessagesListWindow


__author__ = 'daniil-ganiev'


class M3NotifierActionPack(ActionPack):
    url = '/notifier_pack'

    def __init__(self):
        super(M3NotifierActionPack, self).__init__()
        self.actions.extend([ListNotifyMessagesAction, ReadNotifyMessagesAction,
                             NewNotifyMessageAction, EditNotifyMessageAction,
                             SaveNotifyMessageAction, DeleteNotifyMessageAction,])

    def get_list_url(self):
        '''Метод для закрепления позиций на раб. столе\меню приложения'''
        return urls.get_acton_url('list_notify_messages')


class ListNotifyMessagesAction(Action):
    '''Выдаем окно со списком шаблонов для рассылки'''
    url = '/list_notify_messages'
    shortname = 'list_notify_messages'

    def run(self, request, context):
        window = NotifyMessagesListWindow()
        return ExtUIScriptResult(window)


class ReadNotifyMessagesAction(Action):
    '''Создаем список шаблонов рассылки в грид'''
    url = '/read_notify_messages'
    shortname = 'read_notify_messages'

    def context_declaration(self):
        return [ActionContextDeclaration(name='start', type=int, required=True),
                ActionContextDeclaration(name='limit', type=int, required=True),]

    def run(self, request, context):
        messages = NotifyManager().get_messages()
        result_messages = map(lambda (key,message):
                                  {'id': message.template_id,
                                  'description': message.description,
                                  'parent_type': NotifyMessageParentTypeEnum.values[message.parent_type]},
                          messages.items())

        return PreJsonResult({'rows': result_messages,
                              'total': len(result_messages)})


class NewNotifyMessageAction(Action):
    '''Выдаем окно создания шаблона для рассылки'''
    url = '/new_notify_message'
    shortname = 'new_notify_message'

    def run(self, request, context):
        window = EditNotifyMessageWindow(create_new=True)

        return ExtUIScriptResult(window)


class EditNotifyMessageAction(Action):
    url = '/edit_notify_message'
    shortname = 'edit_notify_message'

    def context_declaration(self):
        return [ActionContextDeclaration(name='template_id', required=True,
                                         type=str)]

    def run(self, request, context):
        window = EditNotifyMessageWindow()
        template = NotifyManager().get_messages()[context.template_id]
        template.body = template.default_template_text
#        if template.default_template:
        #TODO: logic with file templates
#            template.body = template.default_template
        window.form.from_object(template)
        return ExtUIScriptResult(window)


class SaveNotifyMessageAction(Action):
    '''Сохраняем шаблон рассылки'''
    url = '/save_notify_message'
    shortname = 'save_notify_message'

    @transaction.commit_on_success
    def run(self, request, context):
        template = NotifyTemplate()

        window = EditNotifyMessageWindow()
        window.form.bind_to_request(request)
        window.form.to_object(template)

        old_templates = NotifyTemplate.objects.filter(template_id=template.template_id)
        for old_template in old_templates:
            old_template.delete()

        template.save()

        NotifyManager().repopulate()

        return OperationResult(success=True)


class DeleteNotifyMessageAction(Action):
    '''Удаление шаблона для рассылки'''
    url = '/delete_notify_message'
    shortname = 'delete_notify_message'

    def context_declaration(self):
        return [ActionContextDeclaration(name='template_id', 
                                         required=True, type=str)]

    @transaction.commit_on_success()
    def run(self, request, context):

        templates = NotifyTemplate.objects.filter(template_id=context.template_id)
        
        for template in templates:
            template.delete()

        NotifyManager().repopulate()
        
        return OperationResult()