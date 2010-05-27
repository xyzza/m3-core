#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

import datetime

from m3.ui.ext.fields.base import BaseExtField
from m3.ui.ext.fields.simple import (ExtNumberField, 
                                     ExtStringField, 
                                     ExtDateField,
                                     ExtCheckBox, ExtComboBox)
from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from base import BaseExtPanel
from m3.ui.ext.fields.complex import ExtDictSelectField
from django.db import models
#from m3.ui.actions.packs import BaseDictionaryActions


class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = None
        self.url = None
        # Параметры специфичные для layout form
        self.label_width = self.label_align = self.label_pad = None
        
        self.request = None
        self.object = None
        
        # поле, которое будет под фокусом ввода после рендеринга формы
        self.focused_field = None 
        
        self.init_component(*args, **kwargs)
    
    def _get_all_fields(self, item, list = None):
        '''
        Возвращает список всех полей формы включая вложенные в контейнеры
        '''
        if list == None:
            list = []
        if isinstance(item, BaseExtField):
            list.append(item)
        elif hasattr(item, 'items'):
            for it in item.items:
                self._get_all_fields(it, list)
        return list
    
    def bind_to_request(self, request):
        '''
        Извлекает из запроса параметры и присваивает их соответствующим полям формы
        '''
        self.request = request or self.request
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            name = field.name
            field.value = self.request.POST.get(name)
    
    #TODO необходимо добавить проверку на возникновение exception'ов
    def from_object(self, object):
        '''
        Метод выполнения прямого связывания данных атрибутов объекта object и полей текущей формы
        '''
        
        def _parse_obj(obj, prefix=''):
            '''
            Разбивает объект на словарь, ключи которого имена полей(имена вложенных 
            объектов записываются через '.'), а значения - значения соответсвующих полей объекта
            '''
            attrs = {}
            object_fields = obj if isinstance(obj, dict) else obj.__dict__
            for key, value in object_fields.items():
                #TODO как определить, что класс встроенный
                if not hasattr(value, '__dict__') and not isinstance(value, dict):
                    attrs[prefix+str(key)] = value
                else:
                    pre_prefix = prefix+'.' if prefix else ''
                    attrs.update(_parse_obj(value, pre_prefix+str(key)+'.'))
            return attrs
        
        def _assign_value(value, item):
            '''
            Конвертирует и присваивает значение value в соответствии типу item.
            '''
            if isinstance(item, (ExtStringField, ExtNumberField,)):
                item.value = unicode(value)
            elif isinstance(item, ExtDateField):
                #TODO уточнить формат дат
                val = value.strftime('%d.%m.%Y')
                item.value = val
            elif isinstance(item, ExtCheckBox):
                item.checked = True if value else False
            elif isinstance(item, ExtDictSelectField):
                # У поля выбора может быть взязанный с ним пак
                if hasattr(item, 'bind_pack'):
                    # Нельзя импортировать, будет циклический импорт
                    #assert isinstance(item.bind_pack, BaseDictionaryActions)
                    row = item.bind_pack.get_row(value)
                    # Может случиться что в источнике данных bind_pack не окажется записи с ключом id
                    # Потому что источник имеет заведомо неизвестное происхождение
                    if row != None:
                        default_text = getattr(row, item.display_field)
                        item.default_text = default_text
                item.value = value
            elif isinstance(item, ExtComboBox) and hasattr(item, 'bind_rule_reverse'):
                # Комбобокс как правило передает id выбранного значения. Его не так просто 
                # преобразовать в тип объекта, т.к. мы ничего не знаем о структуре объекта.
                # Поэтому нужно использовать либо трансляцию значений, либо вызывать специальную
                # функцию внутри экземпляра комбобокса.
                if callable(item.bind_rule_reverse):
                    item.value = str(item.bind_rule_reverse(value))
                elif isinstance(item.bind_rule_reverse, dict):
                    item.value = str(item.bind_rule_reverse.get(value))
                else:
                    raise ValueError('Invalid attribute type bind_rule_reverse. Must be a function or a dict.')
            else:
                item.value = unicode(value)

        
        fields = _parse_obj(object)
        if fields:
            for item in self._get_all_fields(self):
                new_val = fields.get(item.name, None)
                if new_val != None:
                    _assign_value(new_val, item)

    #TODO необходимо добавить проверку на возникновение exception'ов
    def to_object(self, object):
        '''
        Метод выполнения прямого связывания данных атрибутов объекта object и полей текущей формы
        '''

        def set_field(obj, names, value):
            '''
            Ищет в объекте obj поле с именем names и присваивает значение value. Если 
            соответствующего поля не оказалось, то оно не создается
            
            names задается в виде списка, т.о. если его длина больше единицы, то имеются вложенные объекты
            '''
            if hasattr(obj, names[0]):
                if len(names) == 1:
                    if isinstance(obj, dict):
                        obj[names[0]] = value
                    else:
                        # Для id нельзя присваивать пустое значение! Иначе модели не будет сохраняться
                        if names[0] == 'id' and value == '':
                            return

                        setattr(obj, names[0], value)
                else:
                    nested = getattr(obj, names[0], None)
                    set_field(nested, names[1:], value)

        def convert_value(item):
            '''Берет значение item.value, и конвертирует его в соответствии с типом item'a'''
            val = item.value
            if isinstance(item, ExtNumberField):
                val = int(val)
            elif isinstance(item, ExtStringField):
                val = unicode(val)
            elif isinstance(item, ExtDateField):
                #TODO уточнить формат дат
                val = datetime.datetime.strptime(val, '%d.%m.%Y')
            elif isinstance(item, ExtCheckBox):
                val = True if val == 'on' else False
            elif isinstance(item, ExtComboBox):
                # Комбобокс как правило передает id выбранного значения. Его не так просто 
                # преобразовать в тип объекта, т.к. мы ничего не знаем о структуре объекта.
                # Поэтому нужно использовать либо трансляцию значений, либо вызывать специальную
                # функцию внутри экземпляра комбобокса.
                if hasattr(item, 'bind_rule'):
                    if callable(item.bind_rule):
                        val = item.bind_rule(val)
                    elif isinstance(item.bind_rule, dict):
                        val = item.bind_rule.get(val)
                    else:
                        raise ValueError('Invalid attribute type bind_rule. Must be a function or a dict.')
            return val
        
        # Присваиваем атрибутам связываемого объекта соответствующие поля формы
        self.object = object
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            assert isinstance(field.name, str) and len(field.name) > 0,\
                  'The names of all fields must be set for a successful assignment. Check the definition of the form.'
            names = field.name.split('.')
            set_field(self.object, names, convert_value(field))
     
    @property
    def items(self):       
        return self._items


class ExtPanel(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-panel.js'
        self.padding = None
        self.collapsible = False
        self.split = False
        self.init_component(*args, **kwargs)
    
    @property
    def items(self):
        return self._items
    
    
class ExtTabPanel(BaseExtPanel):
    '''
        Класс, отвечающий за работу TabPanel
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self._items = TypedList(type=ExtPanel)
        self.init_component(*args, **kwargs)
    
    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel

    @property
    def tabs(self):
        return self._items
