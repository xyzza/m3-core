#coding:utf-8
'''
Created on 03.02.2011

@author: akvarats
'''

from m3.helpers import urls

from m3.ui.ext import panels
from m3.ui.ext import windows
from m3.ui.ext import fields 
from m3.ui.ext.containers import container_complex, forms
from m3.ui.ext.controls import buttons
from m3.ui.ext.misc.store import ExtDataStore
from m3.contrib.kladr.addrfield import ExtAddrComponent

import models


class ContragentContactsGrid(panels.ExtObjectGrid):
    '''
    Класс контрола "Список контактов контрагента"
    ''' 
    def __init__(self, *args, **kwargs):
        
        super(ContragentContactsGrid, self).__init__(*args, **kwargs)
        
        self.title = u'Контакты'
        
        self.row_id_name = 'contragent_contact_id'
        self.action_new = self.action_edit = urls.get_action('m3-contragents-contacts-edit')
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
        self.action_new = self.action_edit = urls.get_action('m3-contragents-address-edit')
        self.action_data = urls.get_action('m3-contragents-address-data')
        self.action_delete = urls.get_action('m3-contragents-address-delete')
        
        self.add_column(header=u'Адрес', data_index='address', width=400)
        self.add_column(header=u'Тип', data_index='address_type', width=100)
        
        self.init_component(*args, **kwargs)
        
        
class ContragentBankDetailsGrid(panels.ExtObjectGrid):
    '''
    Класс контрола "Список банковских реквизитов контрагента"
    ''' 
    def __init__(self, *args, **kwargs):
        
        super(ContragentBankDetailsGrid, self).__init__(*args, **kwargs)
        
        self.title = u'Банковские реквизиты'
        
        self.row_id_name = 'contragent_bank_detail_id'
        self.action_new = self.action_edit = urls.get_action('m3-contragents-bank-details-edit')
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
        
        
class ContragentContactsEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования контакта контрагента 
    '''
    def __init__(self, create_new = True, *args, **kwargs):
        super(ContragentContactsEditWindow, self).__init__(*args, **kwargs)
        self.width, self.height = 600, 380
        self.min_width, self.min_height = self.width, self.height
        self.title = u'Ввод нового контакта' if create_new else u'Редактирование контакта'

        self._primary = fields.ExtCheckBox(name='primary', box_label=u'Первичный контакт')
        self._name = fields.ExtStringField(anchor='100%', name = 'name', 
                                           max_length = 300, label = u'Наименование')
        self._comment = fields.ExtTextArea(anchor = '100%', name = 'comment', 
                                           label = u'Комментарий',)
        self._send_to = fields.ExtStringField(anchor='100%', name = 'send_to', 
                                           max_length = 300, 
                                           label = u'Представление в рассылке')
        self._phone = fields.ExtStringField(anchor='100%', name = 'phone', 
                                           max_length = 100, label = u'Телефон')
        self._fax = fields.ExtStringField(anchor='100%', name = 'fax', 
                                           max_length = 100, label = u'Факс')
        self._email = fields.ExtStringField(anchor='100%', name = 'email', 
                                           max_length = 100, vtype = 'email',
                                           label = u'Электронная почта')
        
        # Раскладка
        self._table = container_complex.ExtContainerTable(columns=1, rows=7)
        self._table.set_item(row=0, col=0, cmp=self._name)
        self._table.set_item(row=1, col=0, cmp=self._phone)
        self._table.set_item(row=2, col=0, cmp=self._fax)
        self._table.set_item(row=3, col=0, cmp=self._email)
        self._table.set_item(row=4, col=0, cmp=self._send_to)
        self._table.set_item(row=5, col=0, cmp=self._comment)
        self._table.set_item(row=6, col=0, cmp=self._primary)
        self._table.set_row_height(5, 80)
        
        self.contragent = fields.ExtHiddenField(name = 'contragent_id')
        
        self.form = forms.ExtForm(layout='fit')
        self.form.items.extend([
            self._table,
            self.contragent
        ])
        
        # Кнопки
        self.buttons.extend([
            buttons.ExtButton(text=u'Сохранить', handler='submitForm'),
            buttons.ExtButton(text=u'Закрыть', handler='cancelForm')
        ])           
        
    
class ContragentAddressesWindow(windows.ExtWindow):
    '''
    Окно показа информации по адресам контрагента
    '''
    def __init__(self, *args, **kwargs):
        super(ContragentAddressesWindow, self).__init__(*args, **kwargs)
        
        self.title = u'Адреса'
        
        self.width = 700
        self.height = 400
        
        self.layout = 'fit'
        
        self.grid_addresses = ContragentAddressesGrid()
        
        self.items.append(self.grid_addresses)
        

class ContragentAddressesEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования адреса контрагента 
    '''
    def __init__(self, create_new = True, *args, **kwargs):
        super(ContragentAddressesEditWindow, self).__init__(*args, **kwargs)
        self.width, self.height = 600, 300
        self.min_width, self.min_height = self.width, self.height
        self.title = u'Ввод нового адреса' if create_new else u'Редактирование адреса'

        self._type = fields.ExtComboBox(
            label = u'Тип адреса',
            display_field = 'name',
            name = 'address_type',
            value_field = 'id',
            trigger_action_all=True,
            allow_blank = False,
            value = models.AddressType.UR,
        )
        self._type.set_store( ExtDataStore(data=models.AddressType.get_items()) )
        self._comment = fields.ExtTextArea(anchor = '100%', name = 'comment', 
                                           label = u'Комментарий',)
        self._address = ExtAddrComponent(
            place_field_name = 'geo',
            street_field_name = 'street',
            addr_field_name = 'address',
            house_field_name = 'house',
            flat_field_name = 'flat'
        )
        
        # Раскладка
        self._table = container_complex.ExtContainerTable(columns=1, rows=3)
        self._table.set_item(row=0, col=0, cmp=self._type)
        self._table.set_item(row=1, col=0, cmp=self._address)
        self._table.set_item(row=2, col=0, cmp=self._comment)
        self._table.set_row_height(2, 100)
        self._table.set_row_height(1, 100)
        
        self.contragent = fields.ExtHiddenField(name = 'contragent_id')
        
        self.form = forms.ExtForm(layout='fit')
        self.form.items.extend([
            self._table,
            self.contragent
        ])
        
        # Кнопки
        self.buttons.extend([
            buttons.ExtButton(text=u'Сохранить', handler='submitForm'),
            buttons.ExtButton(text=u'Закрыть', handler='cancelForm')
        ])   
        
                
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
        
        
class ContragentBankDetailsEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования банковских реквизитов контрагента 
    '''
    def __init__(self, create_new = True, *args, **kwargs):
        super(ContragentBankDetailsEditWindow, self).__init__(*args, **kwargs)
        self.width, self.height = 600, 350
        self.min_width, self.min_height = self.width, self.height
        self.title = u'Ввод нового банковского реквизита' if create_new \
                else u'Редактирование банковского реквизита'

        self._rs = fields.ExtStringField(name='rschet', label=u'Расчетный счет',
                                  max_length=20, mask_re='[0-9]', anchor='100%')
        self._ks = fields.ExtStringField(name='kschet', label=u'Корреспондентский счет',
                                  max_length=20, mask_re='[0-9]', anchor='100%')
        self._ls = fields.ExtStringField(name='lschet', label=u'Лицевой счет',
                                  max_length=100, anchor='100%')
        self._bik = fields.ExtStringField(name='bik', label=u'БИК', max_length=9, 
                                  mask_re='[0-9]', anchor='100%')
        self._bank_name = fields.ExtStringField(name = 'bank_name',  
                                           label = u'Наименование банка',
                                           max_length = 500, anchor='100%')
                
        # Раскладка
        self._table = container_complex.ExtContainerTable(columns=1, rows=5)
        self._table.set_item(row=0, col=0, cmp=self._bank_name)
        self._table.set_item(row=1, col=0, cmp=self._rs)
        self._table.set_item(row=2, col=0, cmp=self._ks)
        self._table.set_item(row=3, col=0, cmp=self._ls)
        self._table.set_item(row=4, col=0, cmp=self._bik)
        self._table.set_rows_height(50)
        
        self.contragent = fields.ExtHiddenField(name = 'contragent_id')
        
        self.form = forms.ExtForm(layout='fit', label_align = 'top')
        self.form.items.extend([
            self._table,
            self.contragent
        ])
        
        # Кнопки
        self.buttons.extend([
            buttons.ExtButton(text=u'Сохранить', handler='submitForm'),
            buttons.ExtButton(text=u'Закрыть', handler='cancelForm')
        ])                   
     
    
    
    
    
    
    
    
    
    
    
    
    
    