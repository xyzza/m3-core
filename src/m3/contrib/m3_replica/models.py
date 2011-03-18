#coding:utf-8
'''
Модели, которые используются при взаимодействии с внешними
источниками данных.


Created on 27.02.2011

@author: akvarats
'''

from django.db import models

from m3.contrib.m3_audit import (BaseAuditModel,
                                 AuditManager,)
from m3.db import BaseEnumerate

class SyncPointType(BaseEnumerate):
    '''
    Перечисление типов точек синхронизации
    '''
    NOP = 0
    DATA_IN = 1
    DATA_OUT = 2
    DATA_INOUT = 3
    
    values = {NOP: u'Нетипизированная операция',
              DATA_IN: u'Загрузка данных',
              DATA_OUT: u'Выгрузка данных',}
    
class SyncPoint(models.Model):
    '''
    Класс, описывающий точки синхронизации данных, которые были
    выполнены пользователями
    '''
    sync_type = models.SmallIntegerField(choices=SyncPointType.get_choices(), 
                                         default=SyncPointType.NOP,
                                         null=True, blank=True)
    created = models.DateTimeField()
    subject = models.CharField(max_length=200, null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'm3_replica_sync_points'

class ImportedObject(models.Model):
    '''
    Модель, в которой хранится информация о загруженных 
    в текущую прикладную систему
    '''
    # название класса модели, соответствующий объекту загрузки
    model = models.CharField(max_length=200, null=True, blank=True, db_index=True)
    # значение внутреннего ключа (целочисленное для моделей)
    ikey = models.PositiveIntegerField(default=0, db_index=True)
    # значение полного составного ключа, идентифицирующего модель по системе.
    # может использоваться вместо ikey для обозначения ситуации, когда
    ifullkey = models.CharField(max_length=200, null=True, blank=True, db_index=True)
    # значение внешнего ключа
    ekey = models.CharField(max_length=200, null=True, blank=True)
    # признак того, что в результате импорта модель в нашей БД была 
    # создана новая, а не произошла "прицепка" загруженной модели
    # к нашей
    was_created = models.BooleanField(default=True)
    # необязательная ссылка на точку синхронизации
    sync_point = models.ForeignKey(SyncPoint, null=True, blank=True)
    
    class Meta:
        db_table = 'm3_replica_imported_objects'
        
        
    
    