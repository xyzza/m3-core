# -*- coding: utf-8 -*-
from django.db import models
from django.contrib import admin

class SimpleWorkflow(models.Model):
    ''' Примитив класса рабочего процесса. Содержит в себе шаги '''
    name = models.CharField(max_length = 25)

class SimpleStep(models.Model):
    ''' Примитив шага рабочего процесса. Заполнен полями для примера '''
    # Какие-то данные о состоянии шага
    name = models.CharField(max_length = 25)
    creationTime = models.DateTimeField()
    # Процесс которому принадлежит шаг
    workflow = models.ForeignKey(SimpleWorkflow)

class SimpleDocument(models.Model):
    ''' Примитив документа. Исходим из того что документ соответствует только ОДНОМУ процессу '''
    # ОБщие реквизиты документов
    timeStamp = models.DateTimeField(verbose_name = 'Дата создания документа')
    docNumber = models.IntegerField(verbose_name = 'Номер документа')
    revision = models.IntegerField(verbose_name = 'Ревизия')
    deleted  = models.BooleanField(verbose_name = 'Удален')
    workflow = models.OneToOneField(SimpleWorkflow, verbose_name = 'Процесс документа')
    
    # Пример реквизитов
    a = models.CharField(max_length = 25, verbose_name = 'Какой-то реквизит', null = True)

class NamedView(admin.ModelAdmin):
    ''' Класс определяет представление именованных объектов в админке '''
    pass

admin.site.register((SimpleStep, SimpleWorkflow, SimpleDocument))