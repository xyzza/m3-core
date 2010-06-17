#coding:utf-8

#from m3.ui.ext.containers.forms import ExtPanel
from m3.ui.ext.containers.container_complex import ExtContainerTable
from m3.ui.ext.fields.simple import ExtStringField, ExtTextArea
from m3.ui.ext.fields.base import BaseExtTriggerField
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.actions import utils, Action, PreJsonResult, OperationResult
from m3.contrib.kladr.models import KladrGeo, KladrStreet
from django.db.models.query_utils import Q

class ExtPlaceField(BaseExtTriggerField):
    '''
    Поле выбора территории из КЛАДРа 
    '''
    def __init__(self, *args, **kwargs):
        super(ExtPlaceField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-place-select.js'
        self.hide_trigger = True 
        self.min_chars = 2 # количество знаков, с которых начинаются запросы на autocomplete
        self.read_only = False
        self.set_store(ExtJsonStore(id_property='code'))
        #self.value = None
        self.__value = None
        self.url = None
        self.get_store().url = KLADRRowsAction.absolute_url()
        self.value_field = 'code'
        self.query_param = 'filter' 
        self.display_field = 'display_name'
        self.total = 'total'
        self.root = 'rows'
        
        self.init_component(*args, **kwargs)

    @property
    def total(self):
        return self.get_store().total_property
    
    @total.setter
    def total(self, value):
        self.get_store().total_property = value
        
    @property
    def root(self):
        return self.get_store().root
    
    @root.setter
    def root(self, value):
        self.get_store().root = value

    @property
    def value(self):
        return self.__value
    
    @value.setter
    def value(self, val):
        if val:
            place = KladrGeo.objects.filter(code=val).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent')
            if place and len(place) == 1:
                self.default_text = getattr(place[0], self.display_field)
            else:
                self.default_text = ''
                val = ''
        self.__value = val

    def render(self):
        return super(ExtPlaceField, self).render()

class ExtStreetField(BaseExtTriggerField):
    '''
    Поле выбора улицы из КЛАДРа 
    '''
    def __init__(self, *args, **kwargs):
        super(ExtStreetField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-street-select.js'
        self.hide_trigger = True 
        self.min_chars = 2 # количество знаков, с которых начинаются запросы на autocomplete
        self.read_only = False
        self.set_store(ExtJsonStore(id_property='code'))
        #self.value = None
        self.__value = None
        self.url = None
        self.get_store().url = StreetRowsAction.absolute_url()
        self.value_field = 'code'
        self.query_param = 'filter'
        self.display_field = 'display_name'
        self.total = 'total'
        self.root = 'rows'
        self.place_client_id = None
        
        self.init_component(*args, **kwargs)

    @property
    def total(self):
        return self.get_store().total_property
    
    @total.setter
    def total(self, value):
        self.get_store().total_property = value
        
    @property
    def root(self):
        return self.get_store().root
    
    @root.setter
    def root(self, value):
        self.get_store().root = value

    @property
    def value(self):
        return self.__value
    
    @value.setter
    def value(self, val):
        if val:
            place = KladrStreet.objects.filter(code=val).select_related('parent')
            if place and len(place) == 1:
                self.default_text = getattr(place[0], self.display_field)
            else:
                self.default_text = ''
                val = ''
        self.__value = val

    def render(self):
        return super(ExtStreetField, self).render()

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
        while curr_item != None:
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

class ExtAddrComponent(ExtContainerTable):
    '''
    Блок указания адреса 
    '''
    PLACE = 1 # Уровнь населенного пункта
    STREET = 2 # Уровнь улицы 
    HOUSE = 3 # Уровень дома
    FLAT = 4 # Уровень квартиры    
    
    def __init__(self, *args, **kwargs):
        self.level = ExtAddrComponent.FLAT
        self.addr_visible = True
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
        super(ExtAddrComponent, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-addr-field.js'
                
        if self.level == ExtAddrComponent.PLACE:
            self.rows_count = 1
            self.columns_count = 2 
            self.height = 25
        elif self.level == ExtAddrComponent.STREET:
            self.rows_count = 2
            self.columns_count = 2
            self.height = 50
        elif self.level == ExtAddrComponent.HOUSE or self.level == ExtAddrComponent.FLAT:
            self.rows_count = 3
            self.columns_count = 2
            self.height = 75
        if self.addr_visible:
            self.rows_count = self.rows_count+1
            self.height = self.height+43
        self.set_rows_height(25)
        if self.addr_visible:
            self.addr = ExtTextArea(label = self.addr_label, name = self.addr_field_name, anchor='100%', read_only = True, height = 40)
        self.place = ExtPlaceField(label = self.place_label, name = self.place_field_name, anchor='100%')
        if self.addr_visible:
            self.place.handler_change = 'getNewAddr'
        self.set_item(0, 0, self.place, colspan = 2)
        if self.level > ExtAddrComponent.PLACE: 
            self.street = ExtStreetField(label = self.street_label, name = self.street_field_name, anchor='100%', place_client_id = self.place.client_id)
            if self.addr_visible:
                self.street.handler_change = 'getNewAddr'
            self.set_item(1, 0, self.street, colspan = 2)
        if self.level > ExtAddrComponent.STREET:
            self.house = ExtStringField(label = self.house_label, name = self.house_field_name, anchor='100%')
            if self.addr_visible:                
                self.house.handler_change = 'getNewAddr'
            self.set_item(2, 0, self.house)
        if self.level > ExtAddrComponent.HOUSE:
            self.flat = ExtStringField(label = self.flat_label, name = self.flat_field_name, anchor='100%')
            if self.addr_visible:
                self.flat.handler_change = 'getNewAddr'
            self.set_item(2, 1, self.flat)
        if self.addr_visible:
            self.set_item(self.rows_count-1, 0, self.addr, colspan = 2)
            self.set_row_height(self.rows_count-1, 43)
        self.init_component(*args, **kwargs)
