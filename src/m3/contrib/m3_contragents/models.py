#coding:utf-8
'''
Created on 02.02.2011

@author: akvarats
'''

from django.db import models
import mptt

from m3.db import (BaseObjectModel,
                   BaseEnumerate)

#===============================================================================
# Собственно, сами контрагенты
#===============================================================================
class ContragentTypeEnum(BaseEnumerate):
    '''
    Перечисление типов контрагентов.
    
    Нулевое значение зарезервировано под значение фильтра "Все когтрагенты" 
    '''
    UL = 1
    FL = 2
    
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

    #ссылка на родительский элемент
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children')

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
    code = models.CharField(max_length=30, null=True, blank=True)
    
    #==========================================================================
    # Атрибуты юридического лица
    #==========================================================================
    u_short_name = models.CharField(max_length=200, null=True, blank=True)
    u_full_name = models.CharField(max_length=500, null=True, blank=True)
    
    u_inn = models.CharField(max_length=10, null=True, blank=True)
    u_kpp = models.CharField(max_length=10, null=True, blank=True)
    u_filial = models.CharField(max_length=20, null=True, blank=True)
    
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
    
    f_dul_type = models.ForeignKey('m3_dicts.DulType', null=True, blank=True) 
    f_dul_seria = models.CharField(max_length = 20, db_index = True, null = True, blank = True)
    f_dul_number = models.CharField(max_length = 40, db_index = True, null = True, blank = True)
    f_dul_issue_date = models.DateField(null = True, blank = True)
    f_dul_issue_by = models.CharField(max_length = 200, null = True, blank = True)
    
    def name(self):
        return self.u_short_name if self.contragent_type == ContragentTypeEnum.UL else \
               ((self.f_fname or '') + ' ' + (self.f_iname or '') + ' ' + (self.f_oname or '')).strip()
               
    name.json_encode = True
    
    class Meta:
        db_table = 'm3_contragents'

#===============================================================================
# Банковские реквизиты
#===============================================================================
class ContragentBankDetail(BaseObjectModel):
    '''
    Модель хранения банковских реквизитов контрагента
    '''
    # в случае, если банки тоже будут заводится в системе как контрагенты,
    # то мы предусматриваем ссылку на контрагента
    contragent = models.ForeignKey(Contragent, null=True, blank=True, related_name='bank_details')
    bank_contragent = models.ForeignKey(Contragent, null=True, blank=True, related_name='customer_details')
    bank_name = models.CharField(max_length=500, null=True, blank=True)
    bik = models.CharField(max_length=9, null=True, blank=True)
    rschet = models.CharField(max_length=20, null=True, blank=True)
    kschet = models.CharField(max_length=20, null=True, blank=True)
    lschet = models.CharField(max_length=100, null=True, blank=True)
    
    def bank(self):
        '''
        Возвращает имя банка, на основе пары полей bank_name и bank_contragent
        '''
        return self.bank_contragent.name() if self.bank_contragent else self.bank_name
    
    bank.json_encode = True 
    
    class Meta:
        db_table = 'm3_contragent_bankdetails'
        
#===============================================================================
# Контакты контрагента
#===============================================================================
class ContragentContact(BaseObjectModel):
    '''
    Модель контактов контрагента, которые используются при оформлении
    '''
    contragent = models.ForeignKey(Contragent)
    # признак первичного контакта
    primary = models.BooleanField(default=False)
    
    # название контакта (например, ФИО лица)
    name = models.CharField(max_length=300, null=True, blank=True)
    # комментарий к контакту (например, здесь можно указать должность или любую заметку)
    comment = models.TextField(null=True, blank=True)
    
    # как контакт будет представлен в почтовой рассылке
    send_to = models.CharField(max_length=300, null=True, blank=True)
    
    phone = models.CharField(max_length=100, null=True, blank=True)
    fax = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'm3_contragent_contacts'
        
        
#===============================================================================
# Адреса контрагента
#===============================================================================
class AddressType(BaseEnumerate):
    '''
    Перечисление типов адресов
    '''
    UR   = 1 # Юридический адрес
    FACT = 2 # Фактического проживания
    POST = 4 # Почтовый адрес
    TEMP = 8 # Временный адрес
    
    values = {FACT: u'Фактический адрес',
              UR : u'Юридический адрес',
              POST: u'Почтовый адрес',
              TEMP: u'Временный адрес'}
    

class ContragentAddress(BaseObjectModel):
    '''
    Модель хранения адресной информации контрагента 
    '''
    contragent = models.ForeignKey(Contragent)
    address_type = models.PositiveIntegerField(choices=AddressType.get_choices(), 
                                               default=AddressType.UR)
    comment = models.TextField(null=True, blank=True)
    
    
    geo = models.CharField(max_length=13, null=True, blank=True)
    street = models.CharField(max_length=17, null=True, blank=True)
    address = models.CharField(max_length=300, null=True, blank=True)
    
    house    = models.CharField(max_length = 10, null = True, blank = True)
    building = models.CharField(max_length = 5, null = True, blank = True)
    flat     = models.CharField(max_length = 5, null = True, blank = True)
    
    class Meta:
        db_table = 'm3_contragent_addresses'