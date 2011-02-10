#coding:utf-8
'''
Created on 03.02.2011

@author: akvarats
'''

from m3.ui import actions

#===============================================================================
# Набор действий по работе с контрагентами
#===============================================================================
class ContragentActionPack(actions.ActionPack):
    '''
    Экшенпак работы с контрагентами
    '''
    def __init__(self):
        super(ContragentActionPack, self).__init__()
        self.actions.extend([DataContragentContactAction(),
                             SaveContragentContactAction(),
                             DataContragentAddressAction(),
                             SaveContragentAddressAction(),])
        
        
class BaseContragentAction(actions.Action):
    '''
    Базовое действие для контрагентов системы
    '''
    def context_declaration(self):
        return [actions.ACD(name='contragent_id', type=int, required=True, default=0)]
#===============================================================================
# Работа с контактной информацией
#===============================================================================
class DataContragentContactAction(BaseContragentAction):
    '''
    Получение списка контактов контрагента
    '''
    def run(self, request, context):
        pass

class SaveContragentContactAction(BaseContragentAction):
    '''
    Сохранение контакта контрагента
    '''
    def context_declaration(self):
        result = super(SaveContragentContactAction, self).context_declaration()
        result.append(actions.ACD(name='contact_id', type=int, required=True, default=0))
        return result 
    
    def run(self, request, context):
        pass

#===============================================================================
# Работа с адресами контрагента
#===============================================================================
class DataContragentAddressAction(BaseContragentAction):
    '''
    Получение списка адресов контрагента
    '''
    def run(self, request, context):
        pass

class SaveContragentAddressAction(BaseContragentAction):
    '''
    Сохранение адресной информации по контрагенту
    '''
    def context_declaration(self):
        result = super(SaveContragentContactAction, self).context_declaration()
        result.append(actions.ACD(name='address_id', type=int, required=True, default=0))
        return result
    
    def run(self, request, context):
        pass


        