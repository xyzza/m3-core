#coding:utf-8
'''
Created on 03.02.2011

@author: akvarats
'''

from m3.helpers import urls

from m3.ui.ext import panels
from m3.ui.ext import windows


class ContragentContactsGrid(panels.ExtObjectGrid):
    '''
    Класс контрола "Список контактов контрагента"
    ''' 
    def __init__(self, *args, **kwargs):
        
        super(ContragentContactsGrid, self).__init__(*args, **kwargs)
        
        self.title = u'Контакты'
        
        self.row_id_name = 'contragent_contact_id'
        self.action_new = self.action_edit = urls.get_action('m3-contragents-contacts-save')
        self.action_data = urls.get_action('m3-contragents-contacts-data')
        self.action_delete = urls.get_action('m3-contragents-contacts-delete')
        
        self.add_column(header=u'Наименование', data_index='name', width=200)
        self.add_column(header=u'Телефон', data_index='phone', width=100)
        self.add_column(header=u'E-mail', data_index='email', width=100)
        self.add_column(header=u'Факс', data_index='fax', width=100)
        
        self.init_component(*args, **kwargs)
        
        
class ContragentAddressesGrid(panels.ExtObjectGrid):
    '''
    Класс контрола "Список адресов контрагента"
    ''' 
    def __init__(self, *args, **kwargs):
        
        super(ContragentAddressesGrid, self).__init__(*args, **kwargs)
        
        self.title = u'Адреса'
        
        self.row_id_name = 'contragent_address_id'
        self.action_new = self.action_edit = urls.get_action('m3-contragents-address-save')
        self.action_data = urls.get_action('m3-contragents-address-data')
        self.action_delete = urls.get_action('m3-contragents-address-delete')
        
        self.add_column(header=u'Адрес', data_index='name', width=400)
        self.add_column(header=u'Тип', data_index='phone', width=100)
        
        self.init_component(*args, **kwargs)
        
        
class ContragentBankDetailsGrid(panels.ExtObjectGrid):
    '''
    Класс контрола "Список банковских реквизитов контрагента"
    ''' 
    def __init__(self, *args, **kwargs):
        
        super(ContragentBankDetailsGrid, self).__init__(*args, **kwargs)
        
        self.title = u'Банковские реквизиты'
        
        self.row_id_name = 'contragent_bank_detail_id'
        self.action_new = self.action_edit = urls.get_action('m3-contragents-bank-details-save')
        self.action_data = urls.get_action('m3-contragents-bank-details-data')
        self.action_delete = urls.get_action('m3-contragents-bank-details-delete')
        
        self.add_column(header=u'Банк', data_index='bank', width=200)
        self.add_column(header=u'Расч. счет', data_index='rschet', width=100)
        self.add_column(header=u'Корр. счет', data_index='kschet', width=100)
        self.add_column(header=u'Лиц. счет', data_index='lschet', width=100)
        
        self.init_component(*args, **kwargs)
        
        
        
#===============================================================================
# Окна для детализированной информации
#===============================================================================

class ContragentContactsWindow(windows.ExtWindow):
    '''
    Окно показа информации по контактам контрагента
    '''
    def __init__(self, *args, **kwargs):
        super(ContragentContactsWindow, self).__init__(*args, **kwargs)
        
        self.title = u'Контакты'
        
        self.width = 700
        self.height = 400
        
        self.layout = 'fit'
        
        self.grid_contacts = ContragentContactsGrid()
        
        self.items.append(self.grid_contacts)
        
    
class ContragentAddressesWindow(windows.ExtWindow):
    '''
    Окно показа информации по контактам контрагента
    '''
    def __init__(self, *args, **kwargs):
        super(ContragentAddressesWindow, self).__init__(*args, **kwargs)
        
        self.title = u'Адреса'
        
        self.width = 700
        self.height = 400
        
        self.layout = 'fit'
        
        self.grid_addresses = ContragentAddressesGrid()
        
        self.items.append(self.grid_addresses)
        
        
class ContragentBankDetailsWindow(windows.ExtWindow):
    '''
    Окно показа информации по банковским реквизитам контрагента
    '''
    def __init__(self, *args, **kwargs):
        super(ContragentBankDetailsWindow, self).__init__(*args, **kwargs)
        
        self.title = u' '
        
        self.width = 700
        self.height = 400
        
        self.layout = 'fit'
        
        self.grid_bank_details = ContragentBankDetailsGrid()
        
        self.items.append(self.grid_bank_details)
    
    
    
    
    
    
    
    
    
    
    
    
    