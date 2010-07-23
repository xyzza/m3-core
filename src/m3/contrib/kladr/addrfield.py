#coding:utf-8

from django.db.models.query_utils import Q

from m3.ui.ext.containers.base import BaseExtContainer
from m3.ui.ext.fields.simple import ExtHiddenField
from m3.ui.actions import Action, PreJsonResult, OperationResult
from m3.contrib.kladr.models import KladrGeo, KladrStreet
from actions import KLADRPack, kladr_controller

class ExtAddrComponent(BaseExtContainer):
    '''
    Блок указания адреса 
    '''
    PLACE = 1 # Уровнь населенного пункта
    STREET = 2 # Уровнь улицы 
    HOUSE = 3 # Уровень дома
    FLAT = 4 # Уровень квартиры    
    
    VIEW_0 = 0 # хитрый режим (пока не будем делать), когда отображается только адрес, а его редактирование отдельным окном
    VIEW_1 = 1 # в одну строку + адрес
    VIEW_2 = 2 # в две строки + адрес, только для level > PLACE
    VIEW_3 = 3 # в три строки + адрес, только для level > STREET        
    
    def __init__(self, *args, **kwargs):
        super(ExtAddrComponent, self).__init__(*args, **kwargs)
        self.place_field_name = 'place'
        self.street_field_name = 'street'
        self.house_field_name = 'house'
        self.flat_field_name = 'flat'
        self.addr_field_name = 'addr'
        self.place_label = u'Населенный пункт'
        self.street_label = u'Улица'
        self.house_label = u'Дом/Корпус'
        self.flat_label = u'Квартира'
        self.addr_label = u'Адрес'
        
        self.pack = kladr_controller.find_pack(KLADRPack)
        #self.action_getaddr = self.pack.get_addr_action
        self.level = ExtAddrComponent.FLAT
        self.addr_visible = True
        self.view_mode = ExtAddrComponent.VIEW_2
        self.init_component(*args, **kwargs)
        self.layout = 'form'
        self.template = 'ext-fields/ext-addr-field.js'
        self.addr = ExtHiddenField(name = self.addr_field_name, type = ExtHiddenField.STRING);
        self.place = ExtHiddenField(name = self.place_field_name, type = ExtHiddenField.STRING);
        self.street = ExtHiddenField(name = self.street_field_name, type = ExtHiddenField.STRING);
        self.house = ExtHiddenField(name = self.house_field_name, type = ExtHiddenField.STRING);
        self.flat = ExtHiddenField(name = self.flat_field_name, type = ExtHiddenField.STRING);
        self._items.append(self.addr)
        self._items.append(self.place)
        self._items.append(self.street)
        self._items.append(self.house)
        self._items.append(self.flat)
        if self.view_mode == ExtAddrComponent.VIEW_1:
            self.height = 25
        elif self.view_mode == ExtAddrComponent.VIEW_2:
            if self.level > ExtAddrComponent.STREET:
                self.height = 25*2
            else:
                self.height = 25
        elif self.view_mode == ExtAddrComponent.VIEW_3:
            if self.level > ExtAddrComponent.HOUSE:
                self.height = 25*3
            else:
                if self.level > ExtAddrComponent.STREET:
                    self.height = 25*2
                else:
                    self.height = 25
        if self.addr_visible:
            self.height += 36+7

    def render_params(self):
        super(ExtAddrComponent, self).render_params()
        self._put_params_value('place_field_name', self.place_field_name)
        self._put_params_value('street_field_name', self.street_field_name)
        self._put_params_value('house_field_name', self.house_field_name)
        self._put_params_value('flat_field_name', self.flat_field_name)
        self._put_params_value('addr_field_name', self.addr_field_name)
        self._put_params_value('place_label', self.place_label)
        self._put_params_value('street_label', self.street_label)
        self._put_params_value('house_label', self.house_label)
        self._put_params_value('flat_label', self.flat_label)
        self._put_params_value('addr_label', self.addr_label)
        self._put_params_value('addr_visible', (True if self.addr_visible else False ))
        self._put_params_value('level', self.level)
        self._put_params_value('view_mode', self.view_mode)
        self._put_params_value('place_value', (self.place.value if self.place and self.place.value else ''))
        self._put_params_value('place_text', (self.pack.get_place_name(self.place.value) if self.place and self.place.value else ''))
        self._put_params_value('street_value', (self.street.value if self.street and self.street.value else ''))
        self._put_params_value('street_text', (self.pack.get_street_name(self.street.value) if self.street and self.street.value else ''))
        self._put_params_value('house_value', (self.house.value if self.house and self.house.value else ''))
        self._put_params_value('flat_value', (self.flat.value if self.flat and self.flat.value else ''))
        self._put_params_value('addr_value', (self.addr.value if self.addr and self.addr.value else ''))
        self._put_params_value('get_addr_url', (self.pack.get_addr_action.absolute_url() if self.pack.get_addr_action else ''))
        self._put_params_value('kladr_url', (self.pack.get_places_action.absolute_url() if self.pack.get_places_action else ''))
        self._put_params_value('street_url', (self.pack.get_streets_action.absolute_url() if self.pack.get_streets_action else ''))
    
    def render_base_config(self):
        res = super(ExtAddrComponent, self).render_base_config()        
        return res
    
    def render(self):
        self.render_base_config()
        self.render_params()
        
        config = self._get_config_str()
        params = self._get_params_str()
        return 'new Ext.m3.AddrField({%s},{%s})' % (config, params)

    @property
    def items(self):       
        return self._items
    
    @property
    def handler_change_place(self):
        return self._listeners.get('change_place')
    
    @handler_change_place.setter
    def handler_change_place(self, function):
        self._listeners['change_place'] = function
    
    @property
    def handler_change_street(self):
        return self._listeners.get('change_street')
    
    @handler_change_street.setter
    def handler_change_street(self, function):
        self._listeners['change_street'] = function
    
    @property
    def handler_change_house(self):
        return self._listeners.get('change_house')
    
    @handler_change_house.setter
    def handler_change_house(self, function):
        self._listeners['change_house'] = function
    
    @property
    def handler_change_flat(self):
        return self._listeners.get('change_flat')
    
    @handler_change_flat.setter
    def handler_change_flat(self, function):
        self._listeners['change_flat'] = function

    @property
    def handler_before_query_place(self):
        return self._listeners.get('before_query_place')
    
    @handler_before_query_place.setter
    def handler_before_query_place(self, function):
        self._listeners['before_query_place'] = function