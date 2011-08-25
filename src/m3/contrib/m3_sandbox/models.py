#coding:utf-8
__author__ = 'ZIgi'

from django.db import models
from django.contrib.auth import models as django_auth_models

class SandboxAccount(models.Model):
    name = models.CharField(max_length=10, blank=False, null=False)

class SandboxUser(models.Model):
    account = models.ForeignKey(SandboxAccount, null=False)
    user = models.ForeignKey(django_auth_models.User, null=False)
    is_developer = models.BooleanField(default=False)