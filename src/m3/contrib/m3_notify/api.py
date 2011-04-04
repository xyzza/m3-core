#coding:utf-8
import threading

from django.conf import settings
from django.template import Template
from django.template.context import Context
from django.template.loader import find_template
from django.utils.importlib import import_module
from m3.contrib.m3_notify import M3NotifyException
from m3.contrib.m3_notify.backend import BackendFactory

from m3.contrib.m3_notify.models import NotifyTemplate, NotifyMessageParentTypeEnum, BackendTypeEnum

__author__ = 'daniil-ganiev'


class NotificationMessage(object):
    def __init__(self, *args, **kwargs):
        self.template_id = kwargs.get('template_id')
        self.description = kwargs.get('description')
        self.default_template_file = kwargs.get('default_template_file')
        self.default_template_text = kwargs.get('default_template_text', 'Пустой шаблон')

        if self.default_template_file:
            self.default_template_text = find_template(self.default_template_file)[0]

        self.parent_type = kwargs.get('parent_type', NotifyMessageParentTypeEnum.DEFAULT)
        self.default_backend = kwargs.get('default_backend', BackendTypeEnum.EMAIL)

    def form_django_template(self):
        '''Формирует джанговский объект Template на основе своих данных'''
        return Template(self.default_template_text)

class NotifyManager:
    '''Менеджер рассылки шаблонных уведомлений. Синглтон'''
    __shared_state = dict(
        is_loaded = False,
        is_loaded_from_bd = False,
        # словарь шаблонных уведомлений. ключом является идентификатор шаблона
        # NotificationMessage.template_id
        messages = {},
        _write_lock = threading.RLock(),
    )

    def __init__(self):
        # Подход borg pattern от Алекса Мартелли для реализации синглтона(
        # правда не совсем синглтона, но принцип один)
        # К сожалению не работает с новыми объектами =(
        self.__dict__ = self.__shared_state

    def _clear_settings(self):
        '''Очищает настройки, чтобы менеджер был как новый'''
        self.is_loaded = False
        self.is_loaded_from_bd = False
        self.messages.clear()

    def _populate_from_bd(self):
        '''Собирает перегруженные шаблоны рассылки из базы данных'''
        if self.is_loaded_from_bd:
            return False

        self._write_lock.acquire()
        try:
            if self.is_loaded_from_bd:
                return False
            for template in NotifyTemplate.objects.all():
                message = self.make_notify_message_from_model(template)
                if self._validate_notify_message(message, is_from_bd=True):
                    message_key = message.template_id.strip()
                    self.messages[message_key] = message
        finally:
            self._write_lock.release()

    def _populate_from_app(self):
        '''Собирает шаблоны рассылки из app_meta приложений'''
        if self.is_loaded:
            return False
        self._write_lock.acquire()
        try:
            if self.is_loaded:
                return False
            for app_name in settings.INSTALLED_APPS:
                try:
                    module = import_module('.app_meta', app_name)
                except ImportError, err:
                    if err.args[0].find('No module named') == -1:
                        raise
                    continue
                proc = getattr(module, 'register_notify_messages', None)
                if callable(proc):
                    proc()                    
            self.is_loaded = True
        finally:
            self._write_lock.release()

    def _populate(self):
        '''Собирает шаблоны рассылки откуда только можно'''
        self._populate_from_app()
        self._populate_from_bd()

    def _validate_notify_message(self, notify_message, is_from_bd=False):
        '''Проверяет шаблон рассылки на возможность регистрации в менеджере'''
        return (notify_message and
                isinstance(notify_message, NotificationMessage) and
                notify_message.template_id and
                notify_message.template_id.strip() and
                (is_from_bd or not self.messages.has_key(notify_message.template_id))
        )

    def repopulate(self):
        '''Пересобирает шаблоны из приложения и из бд'''
        self._clear_settings()
        self._populate()

    def make_notify_message_from_model(self, notify_template):
        '''Превращает данные из модели БД в объект, воспринимаемый менеджером'''
        return NotificationMessage(template_id=notify_template.template_id,
                                   description=notify_template.description,
                                   default_template_text=notify_template.body,
                                   parent_type = NotifyMessageParentTypeEnum.DB,
                                   default_backend=notify_template.default_backend
        )

    def register_notify_message(self, notify_message):
        '''
        Добавляет шаблон рассылки. Метод должен вызываться только из app_meta,
        иначе не сработает.
        '''
        if not self._validate_notify_message(notify_message):
            return

        message_key = notify_message.template_id.strip()
        self.messages[message_key] = notify_message

    def is_fully_loaded(self):
        return self.is_loaded and self.is_loaded_from_bd

    def get_messages(self):
        if not self.is_fully_loaded():
            self._populate()
            
        return self.messages

    def send_message(self, template_id, context, recipients=(),
                     backend_type=None, subject = None):

        if not self.is_fully_loaded():
            self._populate()

        if isinstance(context,dict):
            context = Context(context)        

        try:
            message = self.messages[template_id]
        except KeyError:
            raise M3NotifyException(u'Не найдено шаблона с таким идентификатором')

        template = message.form_django_template()

        if not backend_type:
            backend_type = message.default_backend
        try:
            backend = BackendFactory().create_backend(backend_type)
            backend.add(template, context, recipients, subject=subject)
            backend.send()
        except Exception, ex:
            raise M3NotifyException(u'Не удалось отправить письмо'+ex)