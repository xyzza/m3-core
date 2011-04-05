#coding:utf-8
'''
Created on 03.02.2011

@author: akvarats
'''

from django.db import transaction

from m3.core import ApplicationLogicException
from m3.ui import actions

import api
import models
import ui

#===============================================================================
# Набор действий по работе с контрагентами
#===============================================================================
class ContragentActionPack(actions.ActionPack):
    '''
    Экшенпак работы с контрагентами
    '''
    url = '/main'
    shortname = 'm3-contragents-main-actions'
    
    def __init__(self):
        super(ContragentActionPack, self).__init__()
        self.contact_save_action = SaveContragentContactAction()
        self.address_save_action = SaveContragentAddressAction()
        self.bank_detail_save_action = SaveContragentBankDetailsAction()
        self.actions.extend([ContragentContactListWindowAction(),
                             DataContragentContactAction(),
                             self.contact_save_action,
                             EditContragentContactAction(),
                             DeleteContragentContactAction(),
                             
                             ContragentAddressListWindowAction(),
                             DataContragentAddressAction(),
                             self.address_save_action,
                             EditContragentAddressAction(),
                             DeleteContragentAddressAction(),
                             
                             ContragentBankDetailListWindowAction(),
                             DataContragentBankDetailsAction(),
                             self.bank_detail_save_action,
                             EditContragentBankDetailsAction(),
                             DeleteContragentBankDetailsAction(),])
        
        
#===============================================================================
# Работа с контактной информацией
#===============================================================================

class ContragentContactListWindowAction(actions.Action):
    '''
    Запрос на получение окна со списком контактной информации по контрагенту 
    '''
    url = '/contacts-window'
    shortname = 'm3-contragents-contacts-window'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True)]
    
    def run(self, request, context):
        
        contragent = api.get_contragent_by_id(context.contragent_id)
        if not contragent:
            return actions.OperationResult(success=False, message=u'Указанный контрагент не найден в базе данных. Показ окна со списком контактов невозможен.')
        
        window = ui.ContragentContactsWindow()
        window.title += ' [%s]' % contragent.name() 
        
        return actions.ExtUIScriptResult(data=window)

class DataContragentContactAction(actions.Action):
    '''
    Получение списка контактов контрагента
    '''
    url = '/contacts-data'
    shortname = 'm3-contragents-contacts-data'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0)]
    
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(data=api.get_contragent_contacts(context.contragent_id))
        

class SaveContragentContactAction(actions.Action):
    '''
    Сохранение контакта контрагента
    '''
    url = '/contacts-save'
    shortname = 'm3-contragents-contacts-save'
    
    def context_declaration(self):
        '''
        '''
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_contact_id', type=int, required=True, default=0)] 
    
    @transaction.commit_on_success
    def run(self, request, context):
        
        create_new = context.contragent_contact_id == 0
        win = ui.ContragentContactsEditWindow(create_new)
        if (not context.contragent_id and 
            not context.contragent_contact_id):
            raise ApplicationLogicException(u'Не указан контрагент для сохранения нового контакта')
        
        if context.contragent_contact_id:
            contact = models.ContragentContact.objects.get(pk=context.contragent_contact_id)
        else:
            contact = models.ContragentContact()
            contact.contragent_id = api.get_contragent_by_id(context.contragent_id)
        
        win.form.bind_to_request(request)
        win.form.to_object(contact)
        contact.save()
        api.detail_changed(user=request.user, 
                           detail=contact,
                           operation_type=api.DETAIL_EDIT if context.contragent_contact_id else api.DETAIL_NEW)
        return actions.OperationResult()
        

class EditContragentContactAction(actions.Action):
    '''
    Получение окна редактирования контакта
    '''
    url = '/contacts-edit'
    shortname = 'm3-contragents-contacts-edit'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_contact_id', type=int, required=True, default=0)]  
        
    def run(self, request, context):
        win = None
        if context.contragent_contact_id == 0:
            win = ui.ContragentContactsEditWindow(create_new=True)
        else:
            win = ui.ContragentContactsEditWindow(create_new=False)
            reg = models.ContragentContact.objects.get(id=context.contragent_contact_id)
            win.form.from_object(reg)
        
        if context.contragent_id:
            win.contragent.value = context.contragent_id
        
        win.form.url = self.parent.contact_save_action.get_absolute_url()
        return actions.ExtUIScriptResult(win)    
    
    
class DeleteContragentContactAction(actions.Action):
    '''
    Удаление контакта контрагента
    '''
    url = '/contacts-delete'
    shortname = 'm3-contragents-contacts-delete'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_contact_id', type=int, required=True),]
    
    @transaction.commit_on_success
    def run(self, request, context):
        contact = models.ContragentContact.objects.get(id=context.contragent_contact_id)
        message = u'' if api.delete_contragent_contact(contact) else u'Не удалось удалить запись о контакте. На нее есть ссылки в базе данных'
        api.detail_changed(user=request.user, 
                           detail=contact,
                           operation_type=api.DETAIL_DELETE)
        return actions.OperationResult.by_message(message)
    
#===============================================================================
# Работа с адресами контрагента
#===============================================================================

class ContragentAddressListWindowAction(actions.Action):
    '''
    Запрос на получение окна со списком адресов по контрагенту 
    '''
    url = '/address-window'
    shortname = 'm3-contragents-address-window'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True)]
    
    def run(self, request, context):
        
        contragent = api.get_contragent_by_id(context.contragent_id)
        if not contragent:
            return actions.OperationResult(success=False, message=u'Указанный контрагент не найден в базе данных. Показ окна со списком адресов невозможен.')
        
        window = ui.ContragentAddressesWindow()
        window.title += ' [%s]' % contragent.name() 
        
        return actions.ExtUIScriptResult(data=window)


class DataContragentAddressAction(actions.Action):
    '''
    Получение списка адресов контрагента
    '''
    url = '/address-data'
    shortname = 'm3-contragents-address-data'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0)]
    
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(data=api.get_contragent_addresses(context.contragent_id))

class SaveContragentAddressAction(actions.Action):
    '''
    Сохранение адресной информации по контрагенту
    '''
    url = '/address-save'
    shortname = 'm3-contragents-address-save'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_address_id', type=int, required=True, default=0)]
    
    @transaction.commit_on_success
    def run(self, request, context):
        create_new = context.contragent_address_id == 0
        win = ui.ContragentAddressesEditWindow(create_new)
        if (not context.contragent_id and 
            not context.contragent_address_id):
            raise ApplicationLogicException(u'Не указан контрагент для сохранения нового контакта')
        
        if context.contragent_address_id:
            address = models.ContragentAddress.objects.get(pk=context.contragent_address_id)
        else:
            address = models.ContragentAddress()
            address.contragent_id = api.get_contragent_by_id(context.contragent_id)
        
        win.form.bind_to_request(request)
        win.form.to_object(address)
        address.save()
        api.detail_changed(user=request.user, 
                           detail=address,
                           operation_type=api.DETAIL_EDIT if context.contragent_address_id else api.DETAIL_NEW)
        return actions.OperationResult()
 
 
class EditContragentAddressAction(actions.Action):
    '''
    Получение окна редактирования контакта
    '''
    url = '/address-edit'
    shortname = 'm3-contragents-address-edit'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_address_id', type=int, required=True, default=0)]  
        
    def run(self, request, context):
        win = None
        if context.contragent_address_id == 0:
            win = ui.ContragentAddressesEditWindow(create_new=True)
        else:
            win = ui.ContragentAddressesEditWindow(create_new=False)
            reg = models.ContragentAddress.objects.get(id=context.contragent_address_id)
            win.form.from_object(reg)
        
        if context.contragent_id:
            win.contragent.value = context.contragent_id
        
        win.form.url = self.parent.address_save_action.get_absolute_url()
        return actions.ExtUIScriptResult(win)  
    
        
class DeleteContragentAddressAction(actions.Action):
    '''
    Удаление контакта контрагента
    '''
    url = '/address-delete'
    shortname = 'm3-contragents-address-delete'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_address_id', type=int, required=True),]
    
    @transaction.commit_on_success
    def run(self, request, context):
        address = models.ContragentAddress.objects.get(id=context.contragent_address_id)
        message = u'' if api.delete_contragent_address(address) else u'Не удалось удалить запись об адресе. На нее есть ссылки в базе данных'
        api.detail_changed(user=request.user, 
                           detail=address,
                           operation_type=api.DETAIL_DELETE)
        return actions.OperationResult.by_message(message)
    
#===============================================================================
# Работа с банковскими реквизитами контрагента
#===============================================================================

class ContragentBankDetailListWindowAction(actions.Action):
    '''
    Запрос на получение окна со списком адресов по контрагенту 
    '''
    url = '/bank-details-window'
    shortname = 'm3-contragents-bank-details-window'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True)]
    
    def run(self, request, context):
        
        contragent = api.get_contragent_by_id(context.contragent_id)
        if not contragent:
            return actions.OperationResult(success=False, message=u'Указанный контрагент не найден в базе данных. Показ окна со списком банковских реквизитов невозможен.')
        
        window = ui.ContragentBankDetailsWindow()
        window.title += ' [%s]' % contragent.name() 
        
        return actions.ExtUIScriptResult(data=window)

class DataContragentBankDetailsAction(actions.Action):
    '''
    Получение списка адресов контрагента
    '''
    url = '/bank-details-data'
    shortname = 'm3-contragents-bank-details-data'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0)]
    
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(data=api.get_contragent_bank_details(context.contragent_id))

class SaveContragentBankDetailsAction(actions.Action):
    '''
    Сохранение адресной информации по контрагенту
    '''
    url = '/bank-details-save'
    shortname = 'm3-contragents-bank-details-save'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_bank_detail_id', type=int, required=True, default=0)]
    
    @transaction.commit_on_success
    def run(self, request, context):
        create_new = context.contragent_bank_detail_id == 0
        win = ui.ContragentBankDetailsEditWindow(create_new)
        if (not context.contragent_id and 
            not context.contragent_bank_detail_id):
            raise ApplicationLogicException(u'Не указан контрагент для сохранения нового контакта')
        
        if context.contragent_bank_detail_id:
            bank_detail = models.ContragentBankDetail.objects.get(pk=context.contragent_bank_detail_id)
        else:
            bank_detail = models.ContragentBankDetail()
            bank_detail.contragent_id = api.get_contragent_by_id(context.contragent_id)
        
        win.form.bind_to_request(request)
        win.form.to_object(bank_detail)
        bank_detail.save()
        api.detail_changed(user=request.user, 
                           detail=bank_detail,
                           operation_type=api.DETAIL_EDIT if context.contragent_bank_detail_id else api.DETAIL_NEW)
        return actions.OperationResult()
 
 
class EditContragentBankDetailsAction(actions.Action):
    '''
    Получение окна редактирования контакта
    '''
    url = '/bank-details-edit'
    shortname = 'm3-contragents-bank-details-edit'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0),
                actions.ACD(name='contragent_bank_detail_id', type=int, required=True, default=0)]  
        
    def run(self, request, context):
        win = None
        if context.contragent_bank_detail_id == 0:
            win = ui.ContragentBankDetailsEditWindow(create_new=True)
        else:
            win = ui.ContragentBankDetailsEditWindow(create_new=False)
            reg = models.ContragentBankDetail.objects.get(id=context.contragent_bank_detail_id)
            win.form.from_object(reg)
        
        if context.contragent_id:
            win.contragent.value = context.contragent_id
        
        win.form.url = self.parent.bank_detail_save_action.get_absolute_url()
        return actions.ExtUIScriptResult(win) 
    
       
class DeleteContragentBankDetailsAction(actions.Action):
    '''
    Удаление банковских реквизитов контрагента
    '''
    url = '/bank-details-delete'
    shortname = 'm3-contragents-bank-details-delete'
    
    def context_declaration(self):
        return [actions.ACD(name='contragent_bank_detail_id', type=int, required=True),]
    
    @transaction.commit_on_success
    def run(self, request, context):
        bank_detail = models.ContragentBankDetail.objects.get(id=context.contragent_bank_detail_id)
        message = u'' if api.delete_contragent_bank_detail(bank_detail) else u'Не удалось удалить запись о банковских реквизитах. На нее есть ссылки в базе данных'
        api.detail_changed(user=request.user, 
                           detail=bank_detail,
                           operation_type=api.DETAIL_DELETE)
        return actions.OperationResult.by_message(message)