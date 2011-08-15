#coding:utf-8
from smtplib import SMTPSenderRefused

from m3.contrib.m3_notify import M3NotifyException
from m3.contrib.m3_notify.models import BackendTypeEnum

from django.core.mail.message import EmailMessage
from django.core.mail import get_connection
from django.conf import settings


__author__ = 'daniil-ganiev'

class Backend(object):
    '''
    Базовый объект бэкенда для менеджера рассылок. Бекенд занимается
    непосредственно процессом рассылки, и его настройкой
    '''
    def add(self, template, context, recipients, **kwargs):
        '''Добавление сообщений в стек'''
        NotImplementedError(u'Метод должен быть перегружен')

    def send(self):
        '''Отправка писем'''
        NotImplementedError(u'Метод должен быть перегружен')


class EMailBackend(Backend):
    '''Бэкенд для рассылки по электронной почте'''

    ADDR_FROM = settings.EMAIL_ADDRESS_FROM
    ADDR_TO = [settings.EMAIL_ADDRESS_TO,]

    def __init__(self):
        self.messages = []
        self.connection =  get_connection(
                      auth_user = settings.EMAIL_HOST_USER,
                      auth_password= settings.EMAIL_HOST_PASSWORD)

    def add(self, template, context, recipients=(), **kwargs):
        kwargs['body'] = template.render(context)
        kwargs['from_email'] = kwargs.get('from_email', EMailBackend.ADDR_FROM)

        to_recipients = []
        to_recipients.extend(self.ADDR_TO)
        if recipients:
            to_recipients.extend(recipients)
        kwargs['to'] = kwargs.get('to', to_recipients)

        msg = EmailMessage(**kwargs)
        msg.content_subtype = "html"

        self.messages.append(msg)

    def send(self):
        if self.messages:
            try:
                self.connection.send_messages(self.messages)
            except SMTPSenderRefused:
                msg = u'Почтовый сервер перегружен. Попробуйте позже.'
                raise M3NotifyException(msg)

class BackendFactory(object):
    '''Завод по изготовлению бэкендов им. Стаханова'''
    def create_backend(self, type):
        '''Генерация бэкенда'''
        backend = Backend()

        if type == BackendTypeEnum.EMAIL:
            backend = EMailBackend()
        elif  type == BackendTypeEnum.DUMMY:
            backend = DummyBackend()

        return backend
    
class DummyBackend(Backend):
    '''Бэкенд который ничего никуда не отправляет'''

    def __init__(self):
        self.messages = []

    def add(self, template, context, recipients=(), **kwargs):
        pass

    def send(self):
        pass
  