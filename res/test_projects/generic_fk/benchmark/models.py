# -*- coding: utf-8 -*-
from django.db import models
from django.contrib import admin
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from datetime import datetime

class BaseWorkflow(models.Model):
    ''' Содержит базовые поля рабочего процесса '''
    name = models.CharField(max_length = 30)
    # Ключ для выборки в тесте 1..1000
    key = models.PositiveSmallIntegerField()
    
    def __unicode__(self):
        return 'Workflow ' + str(self.pk)
    
    class Meta:
        # По этому классу не создается таблицы и не нужны лишние join'ы в запросах ORM
        abstract = True


class Workflow_0(BaseWorkflow):
    ''' Тестовый процесс №0 '''
    a = models.IntegerField()

class Workflow_1(BaseWorkflow):
    ''' Тестовый процесс №1 '''
    b = models.IntegerField()

class BaseDocument(models.Model):
    ''' Содержит базовые поля документа '''
    # Как правило такие поля у документов бывают :)
    docNumber = models.IntegerField(verbose_name = 'Номер документа')
    deleted   = models.BooleanField(default = False, verbose_name = 'Удален')
    revision  = models.IntegerField(default = 0, verbose_name = 'Ревизия')
    creationTime = models.DateTimeField(default = datetime.today())
    
    # Generic relation - не понятно пока как работает
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    workflow = generic.GenericForeignKey('content_type', 'object_id')
    
    def __unicode__(self):
        return 'Document ' + str(self.pk)
    
    class Meta:
        abstract = True
    
class Document_0(BaseDocument):
    ''' Тестовый процесс №0 '''
    a = models.IntegerField()
    
class Document_1(BaseDocument):
    ''' Тестовый процесс №0 '''
    b = models.IntegerField()
    
class Document_2(BaseDocument):
    ''' Тестовый процесс №0 '''
    c = models.IntegerField()

admin.site.register((Workflow_0, Workflow_1, Document_0, Document_1, Document_2))