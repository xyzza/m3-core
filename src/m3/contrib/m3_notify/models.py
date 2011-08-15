#coding:utf-8
from django.db import models

from m3.db import BaseObjectModel, BaseEnumerate

__author__ = 'daniil-ganiev'

class BackendTypeEnum(BaseEnumerate):
    '''
    Тип средства коммуникации, по которому будет вестись рассылка
    (Твиттер, эл. почта, и т.п.)
    '''
    EMAIL = 1
    DUMMY = 2

    values = {EMAIL: u'Электронная почта',DUMMY: u'Не отправлять',}


class NotifyMessageParentTypeEnum(BaseEnumerate):
    '''
    Тип шаблона, который указывает на то, создал ли шаблон пользователь с
    помощью интерфейса
    '''
    DEFAULT = 1
    DB = 2

    values = {DEFAULT: u'Встроен в приложение',
              DB: u'Создан или изменен пользователем'}


class NotifyTemplate(BaseObjectModel):
    '''Шаблон письма для отправки'''
    template_id = models.CharField(max_length=200)
    description = models.CharField(max_length=300, null=True)
    body = models.TextField(null=False)
    default_backend = models.SmallIntegerField(choices=BackendTypeEnum.get_choices(),
                                               default=BackendTypeEnum.EMAIL,
                                               null=True)