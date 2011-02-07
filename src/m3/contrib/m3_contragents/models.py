#coding:utf-8
'''
Created on 02.02.2011

@author: akvarats
'''

from django.db import models
import mptt

from m3.db import (BaseObjectModel,
                   BaseEnumerate)



class ContragentTypeEnum(BaseEnumerate):
    '''
    Перечисление типов контрагентов
    '''
    UL = 0
    FL = 1
    
    values = {UL: u'Юр. лицо',
              FL: u'Физ. лицо'}
    

class ContragentGroup(BaseObjectModel):
    '''
    Группа контрагентов системы
    '''
    # название группы контрагентов
    name = models.CharField(max_length=200, null=True, blank=True)
    # тип контрагентов, для которых предназначена данная группа
    contragent_type = models.SmallIntegerField(choices=ContragentTypeEnum.get_choices(), 
                                               default=ContragentTypeEnum.UL,
                                               null=True, blank=True)
    # владелец группы контрагентов (это можно использовать для
    # организации подчиненности контрагентов
    owner = models.ForeignKey('m3_contragents.Contragent', null=True, blank=True)
    
    class Meta:
        db_table = 'm3_contragent_groups'

mptt.register(ContragentGroup, order_insertion_by=['name'])
    
#===============================================================================
# Базовый класс контрагента системы
#===============================================================================
class Contragent(BaseObjectModel):
    '''
    Базовый контрагент системы
    '''
    contragent_type = models.SmallIntegerField(choices = ContragentTypeEnum.get_choices(), 
                                               default = ContragentTypeEnum.UL)
    parent = models.ForeignKey('ContragentGroup', null=True, blank=True)
    code = models.CharField(max_length=30)
    
    #==========================================================================
    # Атрибуты юридического лица
    #==========================================================================
    u_short_name = models.CharField(max_length=200, null=True, blank=True)
    u_full_name = models.CharField(max_length=500, null=True, blank=True)
    
    u_inn = models.CharField(max_length=10, null=True, blank=True)
    u_kpp = models.CharField(max_length=10, null=True, blank=True)
    
    u_okved = models.CharField(max_length=10, null=True, blank=True) # Общероссийский классификатор видов экономической деятельности
    u_ogrn  = models.CharField(max_length=13, null=True, blank=True) # Основной государственный регистрационный номер
    u_okpo  = models.CharField(max_length=8,  null=True, blank=True) # Общероссийский классификатор предприятий и организаций
    
    #===========================================================================
    # Атрибуты физического лица
    #===========================================================================
    f_fname = models.CharField(max_length=50, null=True, blank=True)
    f_iname = models.CharField(max_length=50, null=True, blank=True)
    f_oname = models.CharField(max_length=50, null=True, blank=True)

    f_inn = models.CharField(max_length=12, null=True, blank=True)
    f_snils = models.CharField(max_length=11, null=True, blank=True) 
    
    def name(self):
        return self.u_short_name if self.contragent_type == ContragentTypeEnum.UL else \
               (self.f_fname + ' ' + self.f_oname + ' ' + self.f_iname).strip()
    
    class Meta:
        db_table = 'm3_contragents'