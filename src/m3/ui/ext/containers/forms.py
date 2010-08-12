#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

import datetime
import decimal

from m3.ui.ext.fields.base import BaseExtField
from m3.ui.ext.fields.simple import (ExtNumberField, 
                                     ExtStringField, 
                                     ExtDateField,
                                     ExtCheckBox, ExtComboBox, ExtTimeField,
                                     ExtHiddenField)
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from base import BaseExtPanel
from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.fields.complex import ExtDictSelectField
from m3.helpers.datastructures import TypedList
#from m3.ui.actions.packs import BaseDictionaryActions


class ExtForm(BaseExtPanel):
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = None
        self.url = None
        self.file_upload = False
        
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
        Извлекает из запроса параметры и присваивает их соответствующим полям 
        формы
        '''
        self.request = request or self.request
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            name = field.name
            field.value = self.request.POST.get(name)
    
    #TODO необходимо добавить проверку на возникновение exception'ов
    def from_object(self, object, exclusion = []):
        '''
        Метод выполнения прямого связывания данных атрибутов объекта object и 
        полей текущей формы
        '''
        
        def _parse_obj(obj, prefix=''):
            '''
            Разбивает объект на словарь, ключи которого имена полей(имена 
            вложенных объектов записываются через '.'), 
            а значения - значения соответсвующих полей объекта
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
        
        def is_secret_token(value):
            ''' 
            Возвращает истину если значение поля содержит секретный ключ с 
            персональной информацией. Он не должен биндится, 
            т.к. предназначен для обработки в personal.middleware 
            '''
            return unicode(value)[:2] == u'##'
        
        def _assign_value(value, item):
            '''
            Конвертирует и присваивает значение value в соответствии типу item.
            '''
            if isinstance(item, (ExtStringField, ExtNumberField,)):
                if value:
                    item.value = unicode(value)
                else:
                    item.value = u''
            elif isinstance(item, ExtDateField):
                #item.value = value.strftime('%d.%m.%Y') \
                # для дат, до 1900 года метод выше не работает
                item.value = '%02d.%02d.%04d' % (value.day,value.month,value.year) \
                    if not is_secret_token(value) else unicode(value)   
                      
            elif isinstance(item, ExtTimeField):
                #item.value = value.strftime('%H:%M') \
                # для дат, до 1900 года метод выше не работает
                item.value = '%02d:%02d' % (value.hour,value.minute) \
                    if not is_secret_token(value) else unicode(value)
                    
            elif isinstance(item, ExtCheckBox):
                item.checked = True if value else False
            elif isinstance(item, ExtDictSelectField):
                # У поля выбора может быть взязанный с ним пак
                # TODO после окончательного удаления метода configure_by_dictpack в ExtDictSelectField
                # нужно удалить проверку на 'bind_pack'
                bind_pack = getattr(item, 'pack', None) or getattr(item, 'bind_pack', None)
                if bind_pack:
                    # Нельзя импортировать, будет циклический импорт
                    #assert isinstance(item.bind_pack, BaseDictionaryActions)
                    row = bind_pack.get_row(value)
                    # Может случиться что в источнике данных bind_pack 
                    # не окажется записи с ключом id
                    # Потому что источник имеет заведомо неизвестное происхождение
                    if row != None:
                        default_text = getattr(row, item.display_field)
                        # getattr может возвращать метод, например verbose_name
                        if callable(default_text):
                            item.default_text = default_text()
                        else:
                            item.default_text = default_text
                item.value = value
            elif isinstance(item, ExtComboBox) and hasattr(item, 'bind_rule_reverse'):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто  преобразовать в тип объекта, 
                # Поэтому нужно использовать либо трансляцию значений, 
                #либо вызывать специальную функцию внутри экземпляра комбобокса.
                if callable(item.bind_rule_reverse):
                    item.value = str(item.bind_rule_reverse(value))
                elif isinstance(item.bind_rule_reverse, dict):
                    item.value = str(item.bind_rule_reverse.get(value))
                else:
                    raise ValueError('Invalid attribute type bind_rule_reverse. \
                        Must be a function or a dict.')
            else:
                item.value = unicode(value)

        
        fields = _parse_obj(object)
        if fields:
            for item in self._get_all_fields(self):
                # заполним атрибуты только те, которые не в списке исключаемых
                if not item.name in exclusion:
                    new_val = fields.get(item.name, None)
                    if new_val != None:
                        _assign_value(new_val, item)

    #TODO необходимо добавить проверку на возникновение exception'ов
    def to_object(self, object, exclusion = []):
        '''
        Метод выполнения обратного связывания данных.
        '''

        def set_field(obj, names, value):
            '''
            Ищет в объекте obj поле с именем names и присваивает значение value. 
            Если соответствующего поля не оказалось, то оно не создается
            
            names задается в виде списка, т.о. если его длина больше единицы, 
            то имеются вложенные объекты
            '''
            if hasattr(obj, names[0]):
                if len(names) == 1:
                    if isinstance(obj, dict):
                        obj[names[0]] = value
                    else:
                        # Для id нельзя присваивать пустое значение! 
                        # Иначе модели не будет сохраняться
                        if names[0] == 'id' and value == '':
                            return

                        setattr(obj, names[0], value)
                else:
                    nested = getattr(obj, names[0], None)
                    set_field(nested, names[1:], value)

        def try_to_int(value, default=None):
            ''' Пробует преобразовать value в целое число, 
            иначе возвращает default '''
            try:
                return int(value)
            except:
                return default

        def convert_value(item):
            '''Берет значение item.value, 
            и конвертирует его в соответствии с типом item'a
            '''
            val = item.value
            if isinstance(item, ExtNumberField):
                if val:
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = decimal.Decimal(val)
                        except decimal.InvalidOperation:
                            val = None
                else:
                    val = None
            elif isinstance(item, ExtStringField):
                val = unicode(val)
            elif isinstance(item, ExtDateField):
                #TODO уточнить формат дат
                if val and val.strip():
                    val = datetime.datetime.strptime(val, '%d.%m.%Y')
                else:
                    val = None
            elif isinstance(item, ExtTimeField):
                if val and val.strip():
                    d = datetime.datetime.strptime(val, '%H:%M')
                    val = datetime.time(d.hour, d.minute, 0)
                else:
                    val = None
            elif isinstance(item, ExtCheckBox):
                val = True if val == 'on' else False
            elif isinstance(item, ExtComboBox):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто преобразовать в тип объекта, 
                # т.к. мы ничего не знаем о структуре объекта.
                # Поэтому нужно использовать либо трансляцию значений, 
                # либо вызывать специальную функцию внутри экземпляра комбобокса.
                if hasattr(item, 'bind_rule'):
                    if callable(item.bind_rule):
                        val = item.bind_rule(val)
                    elif isinstance(item.bind_rule, dict):
                        val = item.bind_rule.get(val)
                    else:
                        raise ValueError('Invalid attribute type bind_rule. \
                                Must be a function or a dict.')
                else:
                    val = try_to_int(val)
                    
            elif isinstance(item, ExtDictSelectField):
                val = try_to_int(val, val) if val else None
                
            elif isinstance(item, ExtHiddenField):
                if item.type == ExtHiddenField.INT:
                    val = try_to_int(val)
                elif item.type == ExtHiddenField.STRING:
                    val = unicode(val)
                    
            return val
        
        # Присваиваем атрибутам связываемого объекта соответствующие поля формы
        self.object = object
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            assert not isinstance(field.name, unicode), 'The names of all fields must not be instance of unicode'
            assert isinstance(field.name, str) and len(field.name) > 0, \
                  'The names of all fields must be set for a successful \
                      assignment. Check the definition of the form.'
            # заполним атрибуты только те, которые не в списке исключаемых
            if not field.name in exclusion:
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
        self.base_cls = ''
        self.body_cls = ''
        self.anchor = ''
        self.init_component(*args, **kwargs)
    
    @property
    def items(self):
        return self._items


class ExtTitlePanel(ExtPanel):
    """Расширенная панель с возможностью добавления контролов в заголовок."""
    def __init__(self, *args, **kwargs):
        super(ExtTitlePanel, self).__init__(*args, **kwargs)
        self.template = "ext-panels/ext-title-panel.js"
        self.__title_items = TypedList(type=ExtUIComponent, on_after_addition=
            self._on_title_after_addition, on_before_deletion=
            self._on_title_before_deletion, on_after_deletion=
            self._on_title_after_deletion)
        self.init_component(*args, **kwargs)

    def _update_header_state(self):
        # Заголовок может быть только в том случае, если есть текстовое значени,
        # либо имеются компоненты
        self.header = self.title or (not self.title and len(self.__title_items))

    def _on_title_after_addition(self, component):
        # Событие вызываемое после добавления элемента в заголовок
        self.items.append(component)
        self._update_header_state() 

    def _on_title_before_deletion(self, component):
        # Событие вызываемое перед удалением элемента из заголовка
        self.items.remove(component)

    def _on_title_after_deletion(self, success):
        # Событие вызываемое после удаления элемента из заголовка
        self._update_header_state()

    def t_render_items(self):
        """Дефолтный рендеринг вложенных объектов."""
        return ",".join([item.render() for item in self._items if
                         item not in self.__title_items])

    def t_render_title_items(self):
        """Дефолтный рендеринг вложенных объектов заголовка."""
        return ",".join([item.render() for item in self.__title_items])

    @property
    def title_items(self):
        return self.__title_items


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

    @property
    def items(self):
        return self._items
    
    
class ExtFieldSet(ExtPanel):
    checkboxToggle = False
    collapsible = False
    def __init__(self, *args, **kwargs):
        super(ExtFieldSet, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-fieldset.js'
        self.checkboxToggle = False
        self.collapsed = False
        self.init_component(*args, **kwargs)
