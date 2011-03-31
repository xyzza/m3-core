#coding:utf-8
from django.db import models

from m3.db import BaseObjectModel, BaseEnumerate

__author__ = 'daniil-ganiev'

class BackendTypeEnum(BaseEnumerate):
    EMAIL = 1

    values = {EMAIL: 'Электронная почта'}


class NotifyTemplate(BaseObjectModel):
    '''Шаблон письма для отправки'''
    template_id = models.CharField(max_length=200)
    description = models.CharField(max_length=300, null=True)
    body = models.TextField(null=False)
    default_backend = models.SmallIntegerField(choices=BackendTypeEnum.get_choices(),
                                               default=BackendTypeEnum.EMAIL,
                                               null=True)