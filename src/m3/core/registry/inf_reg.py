# -*- coding: utf-8 -*-
from django.db import models
import datetime


class RegistryValueDoesNotExists(Exception):
    pass

class InformationRegistryManager(models.Manager):    
    def _check_fields(self, fields):
        ''' Проверяет названия полей на наличие в таблице '''
        if (fields == None):
            return dict()
        if type(fields) != dict:
            raise ValueError('Значение должно быть словарем!')
        for name in fields.keys():
            if type(name) != str:
                raise ValueError('Ключ должен быть строковым названием поля!')
            if (name not in self.model.dimensions) and (name not in self.model.resources):
                raise ValueError('Обращение к несуществующему полю ' + name + ' регистра ' + str(self.model))
    
    def _add_isnulls(self, fields, available_fields):
        ''' 
        Забивает NULL не перечисленные пользователем поля
        Чтобы поиск по ключу не сбивался нужно однозначное соответствие 
        '''
        # Находим недостающие поля
        av = list(available_fields)
        for f in fields.keys():
            if f in av:
                av.remove(f)
        # Забиваем нулевыми фильтрами
        for f in av:
            fields[f + '__isnull'] = True
    
    def set_reg(self, date, dim, res):
        ''' Устанавливает ресурсы регистра в соответствии с датой и измерениями '''
        self._check_fields(dim)
        self._check_fields(res)
        
        # Создание ключевых условий для поиска по измерениям
        self._add_isnulls(dim, self.model.dimensions)
        dim['date'] = date
        qs = super(InformationRegistryManager, self).get_query_set()
        try:
            row = qs.get(**dim)
        except self.model.DoesNotExist:
            row = self.model(**dim)
        
        # Если запись уже есть, то устанавливаем новые значения ресурсов
        for k, v in res.items():
            row.__setattr__(k, v)
        row.save()
    
    def get_reg(self, date, dim = None, strict = False):
        '''
        Возвращает значение регистра по заданным измерениям отбора на заданную дату
        @param date: Дата по которой идет простотр регистра
        @param dim: Измерения по которым проводится выборка
        @param strict: Строгий поиск соответствия
        '''
        self._check_fields(dim)
        self._add_isnulls(dim, self.model.dimensions)
        qs = super(InformationRegistryManager, self).get_query_set()
        
        if strict:
            dim['date'] = date
            try:
                return qs.get(**dim)
            except self.model.DoesNotExist:
                raise RegistryValueDoesNotExists()
        else:
            values = qs.filter(**dim).order_by('-date')
            try:
                row = values.filter(date__lte = date)[0] # Меньше или равно + TOP 1
                return row
            except IndexError:
                raise RegistryValueDoesNotExists()
        # Что-то есть, уже хорошо
        print row

class BaseInformationRegistry(models.Model):
    ''' Базовый класс для создания регистров сведений '''
    _reserved_fields = ('date', 'content_type')
    _minimal_date = datetime.datetime(1970, 1, 1)
    objects = InformationRegistryManager()
    
    date = models.DateTimeField(default = _minimal_date, db_index = True)
    
    class Meta:
        abstract = True
