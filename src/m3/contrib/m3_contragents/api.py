#coding:utf-8
'''
Created on 08.02.2011

@author: akvarats
'''

from m3.helpers import validation
from m3.helpers import queries
from models import (ContragentTypeEnum,
                    Contragent,
                    ContragentGroup,
                    ContragentContact,
                    ContragentAddress,
                    ContragentBankDetail,)
from exceptions import (ContragentDoesNotExist,
                        SaveContragentException,)

#===============================================================================
# Контрагент - юридическое лицо
#===============================================================================

class BaseContragentProxy(object):
    '''
    Базовый класс прокси объекта контрагента
    '''
    
    UL = ContragentTypeEnum.UL
    FL = ContragentTypeEnum.FL
    
    proxy_model_field_mapping = {(UL, 'short_name'): 'u_shortname',
                                 (UL, 'full_name'): 'u_full_name',
                                 (UL, 'inn'): 'u_inn',
                                 (UL, 'kpp'): 'u_kpp',
                                 (UL, 'filial'): 'u_filial',
                                 (UL, 'okved'): 'u_okved',
                                 (UL, 'ogrn'): 'u_ogrn',
                                 (UL, 'okpo'): 'u_okpo',
                                 (FL, 'fname'): 'f_fname',
                                 (FL, 'iname'): 'f_iname',
                                 (FL, 'oname'): 'f_oname',
                                 (FL, 'inn'): 'f_inn',
                                 (FL, 'snils'): 'f_snils',}
    
    def __init__(self, *args, **kwargs):
        self.clear()
        
    def clear(self):
        '''
        Приводит состояние объекта в первоначальное состояние.
        
        Данную функцию необходимо переопределять в дочерних классах классе
        '''
        self.id = None
    
    def is_new(self):
        '''
        Возвращает True в случае, если объект соответствует новой (несохраненной)
        модели контрагента.
        '''
        return not self.id
        
    def validate(self):
        '''
        Выполняет проверку данных контрагента перед заполнением
        '''
        pass
    
    
    def load(self, contragent_id):
        '''
        Выполняет заполнение объекта на основе переданных данных
        '''
        pass
    
    def _prepare_save(self, contragent):
        '''
        Метод, который производит подготовку объекта контрагента к сохранению
        '''
        for ((ctype, proxy_name), model_name) in self.proxy_model_field_mapping.items():
            if ctype == contragent.contragent_type:
                setattr(contragent, model_name, getattr(self, proxy_name))
    
    def save(self):
        '''
        Выполняет сохранение данных контрагента
        '''
        # восстанавливаем состояние контрагента перед сохранением
        if self.id:
            # типа, объект существующий. достаем его из базы данных
            contragent = get_contragent_by_id(self.id)
        else:
            contragent = Contragent()
        
        # записываем новое состояние объекта
        self._prepare_save(contragent)
        
        # сохраняем объект с новым состоянием
        contragent.save()
        
        # выставляем получившийся id
        self.id = contragent.id
        
#===============================================================================
# Прокси объект для контрагента-юридического лица
#===============================================================================
class UContragentProxy(BaseContragentProxy):
    '''
    Прокси-объект, который за работу с контрагентом, как с юридическим лицом
    '''        
        
    def clean(self):
        '''
        Очистка состояния объекта контрагента-юридического лица
        '''
        super(UContragentProxy, self).clear()
        
        self.short_name = '' 
        self.full_name = ''
        self.inn = ''
        self.kpp = ''
        self.filial = ''
        self.ogrn = ''
        self.okved = ''
        self.okpo = ''
        
    def _prepare_save(self, contragent):
        '''
        '''
        if (not self.is_new() and 
            contragent.contragent_type != ContragentTypeEnum.UL):
            raise SaveContragentException(u'Попытка сохранить объект UContragentProxy для ')
        
        super(UContragentProxy, self)._prepare_save(contragent)
        

#===============================================================================
# Прокси объект для контрагента-физического лица
#===============================================================================
class FContragentProxy(BaseContragentProxy):
    '''
    Прокси-объект для контрагента-физического лица
    '''
    
    def clear(self):
        '''
        Очистка состояния объекта контрагента-юридического лица
        '''
        super(FContragentProxy, self).clear()
        
        self.fname = ''
        self.iname = ''
        self.oname = ''
        
        self.inn = ''
        self.snils = ''
        
        
#===============================================================================
# Методы доставания данных из базы данных
#===============================================================================
def get_contragent_by_id(contragent_id):
    '''
    Возвращает объект контрагента по указанному идентификатору в базе данных.
    
    В случае, если такого контрагента в БД не существует, то возвращается 
    значение None.
    '''
    result = None
    if contragent_id and isinstance(contragent_id, int):
        try:
            result = Contragent.objects.get(pk=contragent_id)
        except Contragent.DoesNotExist:
            raise ContragentDoesNotExist(u'Контрагент с идентификатором "%s" не существует.' % contragent_id)
    return result

def get_contragents(filter='', contragent_type=0):
    '''
    Возвращает запрос в таблицу с контрагентами.
    
    Возможна установка следующих фильтров:
    * filter - текстовый фильтр над полями "Наименование", "Полное наименование", 
               "ФИО", "ИНН", "КПП" 
    '''
    query = Contragent.objects.all()
    if isinstance(filter, str) and filter.strip():
        # если задана строка фильтрации, то накладываем ее
        # в соответствии с правилами установки фильтров
        # для различных типов контрагентов
        u_filtered_fields = ['u_short_name', 'u_full_name', 'u_inn', 'u_kpp']
        f_filtered_fields = ['f_fname', 'f_iname', 'f_oname', 'f_inn']
        
        filtered_fields = []
        if contragent_type == ContragentTypeEnum.UL:
            filtered_fields.extend(u_filtered_fields)
        elif contragent_type == ContragentTypeEnum.FL:
            filtered_fields.extend(f_filtered_fields)
        else:
            filtered_fields.extend(u_filtered_fields)
            filtered_fields.extend(f_filtered_fields)
        
        query = query.filter(queries.spaced_q_expressions(filter, 
                                                          filtered_fields))
    if contragent_type:
        query = query.filter(contragent_type=contragent_type)
    
    return query

def get_contragent_contacts(contragent):
    '''
    Возвращает список контактной информации по указанному контрагенту
    '''
    return ContragentContact.objects.filter(contragent=contragent).order_by('-primary', 'id')
       

def get_contragent_addresses(contragent):
    '''
    Возвращает список адресов контрагентов
    '''
    return ContragentAddress.objects.filter(contragent=contragent).order_by('address_type', 'id')


def get_contragent_bank_details(contragent):
    '''
    Возвращает список банковских реквизитов контрагента
    '''
    return ContragentBankDetail.objects.filter(contragent=contragent)\
                                       .select_related('bank_contragent')\
                                       .order_by('id')


#===============================================================================
# Удаление информации по связанным с контрагентом таблицам из БД
# (контакты, адреса, банковские реквизиты)
#===============================================================================
def _delete_contragent_detail(detail, model):
    '''
    Удаление записи о записи из таблицы с атрибутами контрагента. 
    
    Возвращает False в случае, если объект не был удален из базы данных по 
    причине наличия ссылок на него. Во всех остальных случаях возвращается True
    либо выдается исключительная ситуация.
    '''
    if not detail:
        return True
    
    if isinstance(detail, int):
        try:
            object_to_delete = model.objects.get(pk=detail)
        except model.DoesNotExist:
            return True
    else:
        object_to_delete = detail
        
    return object_to_delete.safe_delete()

def delete_contragent_contact(contact):
    '''
    Удаление записи о записи контакта контрагента из базы данных. 
    
    Возвращает False в случае, если объект не был удален из базы данных по 
    причине наличия ссылок на него. Во всех остальных случаях возвращается True
    либо выдается исключительная ситуация.
    '''
    return _delete_contragent_detail(contact, ContragentContact)
    
def delete_contragent_address(address):
    '''
    Удаление записи о записи адреса контрагента из базы данных. 
    
    Возвращает False в случае, если объект не был удален из базы данных по 
    причине наличия ссылок на него. Во всех остальных случаях возвращается True
    либо выдается исключительная ситуация.
    '''
    return _delete_contragent_detail(address, ContragentAddress)

def delete_contragent_bank_detail(bank_detail):
    '''
    Удаление записи о записи банковских реквизитов из базы данных. 
    
    Возвращает False в случае, если объект не был удален из базы данных по 
    причине наличия ссылок на него. Во всех остальных случаях возвращается True
    либо выдается исключительная ситуация.
    '''
    return _delete_contragent_detail(bank_detail, ContragentBankDetail)