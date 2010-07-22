#coding:utf-8

from django.db.models.query_utils import Q

from m3.ui.ext.containers.base import BaseExtContainer
from m3.ui.ext.fields.simple import ExtHiddenField
from m3.ui.actions import Action, PreJsonResult, OperationResult
from m3.contrib.kladr.models import KladrGeo, KladrStreet


class KLADRRowsAction(Action):
    '''
    Перечисление элементов КЛАДРа
    '''
    url = '/kladr_rows$'
    
    def run(self, request, context):
        filter = request.REQUEST.get('filter')
        fields = ['name','code','socr'];
        words = filter.strip().split(' ')
        # первым этапом найдем территории подходящие под фильтр в имени
        condition = None
        for word in words:
            field_condition = None
            for field_name in fields:
                field = Q(**{field_name + '__icontains': word})
                field_condition = field_condition | field if field_condition else field
            condition = condition & field_condition if condition else field_condition
        places = KladrGeo.objects.filter(condition).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent').order_by('level','name')[0:50]
        # если не нашли, то будем искать с учетом родителей
        if len(places) == 0:
            condition = None
            for word in words:
                field_condition = None
                for field_name in fields:
                    field = Q(**{field_name + '__icontains': word}) | Q(**{'parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__parent__' + field_name + '__icontains': word})
                    field_condition = field_condition | field if field_condition else field
                condition = condition & field_condition if condition else field_condition
            places = KladrGeo.objects.filter(condition).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent').order_by('level','name')[0:50]
        result = {'rows': list(places), 'total': len(places)}
        return PreJsonResult(result)

class StreetRowsAction(Action):
    '''
    Перечисление улиц
    '''
    url = '/street_rows$'
    
    def run(self, request, context):
        filter = request.REQUEST.get('filter')
        place_code = request.REQUEST.get('place_code')
        place_id = None
        if place_code:
            place = KladrGeo.objects.filter(code=place_code)
            if place and len(place) == 1:
                place_id = place[0].id
        fields = ['name','code','socr'];
        words = filter.strip().split(' ')
        # первым этапом найдем территории подходящие под фильтр в имени
        condition = None
        for word in words:
            field_condition = None
            for field_name in fields:
                field = Q(**{field_name + '__icontains': word})
                field_condition = field_condition | field if field_condition else field
            condition = condition & field_condition if condition else field_condition
        if place_id:
            places = KladrStreet.objects.filter(condition, parent = place_id).select_related('parent').order_by('name')[0:50]
        else:
            places = KladrStreet.objects.filter(condition).select_related('parent').order_by('name')[0:50]
        # если не нашли, то будем искать с учетом родителей
        if len(places) == 0:
            condition = None
            for word in words:
                field_condition = None
                for field_name in fields:
                    field = Q(**{field_name + '__icontains': word}) | Q(**{'parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__parent__' + field_name + '__icontains': word})
                    field_condition = field_condition | field if field_condition else field
                condition = condition & field_condition if condition else field_condition
            if place_id:
                places = KladrStreet.objects.filter(condition, parent = place_id).select_related('parent').order_by('name')[0:50]
            else:
                places = KladrStreet.objects.filter(condition).select_related('parent').order_by('name')[0:50]
        result = {'rows': list(places), 'total': len(places)}
        return PreJsonResult(result)
    
class KLADRGetAddrAction(Action):
    '''
    Расчет адреса по составляющим
    '''
    url = '/kladr_getaddr$'
    
    def run(self, request, context):
        place = request.REQUEST.get('place')
        if place:
            place = KladrGeo.objects.filter(code=place)[0]
        street = request.REQUEST.get('street')
        if street:
            street = KladrStreet.objects.filter(code=street)[0]
        house = request.REQUEST.get('house')
        flat = request.REQUEST.get('flat')
        addr_cmp = request.REQUEST.get('addr_cmp')
        '''
        типАдреса = 0 или 1
        текИндекс = 0
        адрес = ""
        текУровень = 5
        текЭлемент = кодУлицы
        если типАдреса = 0
            раделитель = ", "
        иначе
            раделитель = ","
        пока текЭлемент >= 0
            если типАдреса > 0 и текЭлемент = 0
                выход
            для всех территорий у которых код = текЭлемент
                имя = территория.имя
                родитель = территория.родитель
                уровень = территория.уровень
                индекс = территория.индекс
                сокр = территория.сокр
                если текИндекс = 0 и индекс <> 0, то текИндекс = индекс
                если типАдреса = 0
                    адрес = сокр+" "+имя+раделитель+адрес
                иначе
                    текЭлемент = родитель
                    пока текУровень > уровень
                        текУровень = текУровень-1
                        адрес = раделитель+адрес
                    адрес = сокр+" "+имя+раделитель+адрес
                    текУровень = текУровень-1
            если текЭлемент = 0 и родитель = 0
                выход
            текЭлемент = родитель
        если типАдреса = 0
            если индекс > 0
                адрес = индекс+раделитель+адрес
        иначе
            пока текУровень > 1
                текУровень = текУровень-1
                адрес = раделитель+адрес
            адрес = регион+раделитель+адрес
            если индекс > 0
                адрес = раделитель+индекс+раделитель+адрес
            иначе
                адрес = раделитель+раделитель+адрес
        '''
        addr_type = 0
        curr_index = ''
        addr_text = ''
        curr_level = 5
        if street:
            curr_item = street
        else:
            curr_item = place
        if addr_type == 0:
            delim = ', '
        else:
            delim = ','
        while curr_item:
            if addr_type != 0 and curr_item.parent == None:
                break
            if curr_index == '' and curr_item.zipcode:
                curr_index = curr_item.zipcode
            if addr_type == 0:
                addr_text = curr_item.socr+" "+curr_item.name+delim+addr_text
            else:
                if curr_item == street:
                    lv = 4
                else:
                    lv = curr_item.level
                while curr_level > lv:
                    curr_level -= 1
                    addr_text = delim+addr_text
                addr_text = curr_item.socr+" "+curr_item.name+delim+addr_text
                curr_level -= 1
            curr_item = curr_item.parent
        if addr_type == 0:
            if curr_index != '':
                addr_text = curr_index+delim+addr_text
        else:
            while curr_level > 1:
                curr_level -= 1
                addr_text = delim+addr_text
            addr_text = 'регион'+delim+addr_text
            if curr_index != '':
                addr_text = curr_index+delim+addr_text
            else:
                addr_text = delim+delim+addr_text
        if house:
            addr_text = addr_text+u'д. '+house
        if flat:
            addr_text = addr_text+delim+u'кв. '+flat
        result = u'(function(){ Ext.getCmp("'+addr_cmp+'").setValue("'+addr_text+'");})()'
        return OperationResult(success=True, code = result)

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
        self.action_getaddr = KLADRGetAddrAction
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
        
        
        res = ''        
        par = []
        par.append('place_field_name: "%s"' % (self.place_field_name if self.place_field_name else '')) 
        par.append('street_field_name: "%s"' % (self.street_field_name if self.street_field_name else ''))
        par.append('house_field_name: "%s"' % (self.house_field_name if self.house_field_name else ''))
        par.append('flat_field_name: "%s"' % (self.flat_field_name if self.flat_field_name else ''))
        par.append('addr_field_name: "%s"' % (self.addr_field_name if self.addr_field_name else ''))
        
        par.append('place_label: "%s"' % (self.place_label if self.place_label else '')) 
        par.append('street_label: "%s"' % (self.street_label if self.street_label else ''))
        par.append('house_label: "%s"' % (self.house_label if self.house_label else ''))
        par.append('flat_label: "%s"' % (self.flat_label if self.flat_label else ''))
        par.append('addr_label: "%s"' % (self.addr_label if self.addr_label else ''))
        par.append('addr_visible: %s' % ('true' if self.addr_visible else 'false' ))
        
        par.append('level: %s' % self.level)
        par.append('view_mode: %s' % self.view_mode)
        
        par.append('place_value: "%s"' % (self.place.value if self.place and self.place.value else ''))
        place = KladrGeo.objects.filter(code=self.place.value).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent')        
        par.append('place_text: "%s"' % (place[0].display_name() if place and len(place) == 1 else ''))         
        par.append('street_value: "%s"' % (self.street.value if self.street and self.street.value else ''))
        street = KladrStreet.objects.filter(code=self.street.value).select_related('parent')
        par.append('street_text: "%s"' % (street[0].display_name() if street and len(street) == 1 else ''))
        par.append('house_value: "%s"' % (self.house.value if self.house and self.house.value else ''))
        par.append('flat_value: "%s"' % (self.flat.value if self.flat and self.flat.value else ''))
        par.append('addr_value: "%s"' % (self.addr.value if self.addr and self.addr.value else ''))
        
        par.append('get_addr_url: "%s"' % (self.action_getaddr.absolute_url() if self.action_getaddr else ''))        
        par.append('kladr_url: "%s"' % KLADRRowsAction.absolute_url())
        par.append('street_url: "%s"' % StreetRowsAction.absolute_url())
        
        res += ',\n'.join(par)                
        return res
    
    def render_base_config(self):
        res = super(ExtAddrComponent, self).render_base_config()        
        return res
    
    def render(self):
        self.render_base_config()
        self.render_params()
        
        base_config = self._get_config_str()
        params = self.render_params()
        return 'new Ext.m3.AddrField({%s},{%s})' % (base_config, params)

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