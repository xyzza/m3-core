#coding:utf-8
from m3.db import BaseEnumerate

__author__ = 'Excinsky'

class MetaParameterTypeEnum(BaseEnumerate):
    """
    Тип параметра ответа на запрос метаинформации для создания профиля.
    """
    INT = 1
    STRING = 2
    BOOL = 3
    LIST = 4
    DICT = 5

    values = {INT: 'int', STRING: 'string', BOOL: 'bool', LIST: 'list',
              DICT:'dict'}

class MetaParameter(object):
    """
    Параметр ответа на запрос метаинформации для создания профиля.
    """
    def __init__(self, code, name, type, hint='', target=''):
        """
        @param code: Код
        @type code: string
        @param name: Название
        @type name: string
        @param type: Тип
        @type type: MetaParameterTypeEnum value key.
        @param hint: Подсказка
        @type hint: string
        @param target: Расширение понятия типа.
        @type target: string
        """
        self._code = code
        self._name = name
        self._type = type
        self._hint = hint
        self._list_items = []

        self._set_target(target)

    def get_code(self):
        """
        Возвращает атрибут параметра "код".

        @return: str
        """
        return self._code

    def get_name(self):
        """
        Возвращает атрибут параметра "название".

        @return: str
        """
        return self._name

    def get_type(self):
        """
        Возвращает тип параметра.

        @return: MetaParameterTypeEnum key.
        """
        return self._type

    def get_type_value(self):
        """
        Возвращает значение, соответствующее ключу из MetaParameterTypeEnum

        @return: str
        """
        return MetaParameterTypeEnum.values[self._type]

    def get_hint(self):
        """
        Возвращает атрибут параметра "подсказка".

        @return: str
        """
        return self._hint

    def get_target(self):
        """
        Возвращает атрибут параметра "расширение понятия типа".

        @return: str
        """
        return self._target

    def is_list(self):
        """
        Является ли параметр списком?

        @return: bool
        """
        return self._type == MetaParameterTypeEnum.LIST

    def is_dict(self):
        """
        Является ли параметр словарем?

        @return: bool
        """
        return self._type == MetaParameterTypeEnum.DICT

    def _set_target(self, target):
        """
        Устанавливает атрибут target у параметра

        @param target: Значение к установке.
        @type target: str
        """
        if self.is_dict():
            self._target = target
        else:
            self._target = None

    def add_list_items(self, *args):
        """
        Добавляет элементы в список, если тип параметра -- list

        @param *args: Элементы для добавления в список
        @type *args: list of MetaParameterListItem

        @return: None
        """
        if self.is_list():
            for item in args:
                if isinstance(item, MetaParameterListItem):
                    self._list_items.append(item)

    def get_list_items(self):
        """
        Получает список элементов параметра-списка.

        @return: list of MetaParameterListItem.
        """
        if self.is_list():
            return self._list_items
        else:
            return []


class MetaParameterListItem(object):
    """
    Элемент параметра-списка ответа на запрос метаинформации.
    """
    def __init__(self, code, name, parent='', enabled=False):
        """
        @param code: Код
        @type code: str
        @param name: Название
        @type name: str
        @param parent: Родительский элемент
        @type parent: str
        @param enabled: Доступность элемента для выбора пользователем на
            странице создания профиля.
        @type enabled: bool
        """
        self._code = code
        self._name = name
        self._parent = parent
        self._enabled = enabled

    def get_code(self):
        """
        Возвращает атрибут параметра "код".

        @return: str
        """
        return self._code

    def get_name(self):
        """
        Возвращает атрибут параметра "название".

        @return: str
        """
        return self._name

    def get_parent(self):
        """
        Возвращает атрибут параметра "родитель".

        @return: str
        """
        return self._parent

    def is_enabled(self):
        """
        Элемент доступен для выбора пользователем?

        @return: bool
        """
        return self._enabled

    def get_enabled_string(self):
        """
        Возвращает доступность элемента в виде строки

        @return: str
        """
        if self.is_enabled():
            return '1'
        else:
            return '0'


class LicenseMetaResultObjectTypeEnum(BaseEnumerate):
    """
    @enum
    Тип объекта лицензирования
    """
    INT = 1
    BOOL = 2

    values = {INT: 'int', BOOL: 'bool'}


class LicenseMetaObject(object):
    def __init__(self, code, name, type=LicenseMetaResultObjectTypeEnum.INT):
        """
        @param code: Код объекта лицензирования
        @type code: str
        @param name: Название объекта лицензирования.
        @type name: str
        @param type: Тип объекта лицензирования
        @type type: LicenseMetaResultObjectTypeEnum key
        """
        self._code = code
        self._name = name
        
        if type not in LicenseMetaResultObjectTypeEnum.values.keys():
            self._type = LicenseMetaResultObjectTypeEnum.INT
        else:
            self._type = type

    def get_code(self):
        return self._code

    def get_name(self):
        return self._name

    def get_type(self):
        return self._type

    def get_type_as_string(self):
        return LicenseMetaResultObjectTypeEnum.values[self._type]


class ProfileRatesParam(object):
    """
    Параметр запроса о тарифном плане аккаунта
    """
    def __init__(self, code, min_value='', max_value=''):
        """
        @param code: Код.
        @param min_value: Минимальное значение.
        @param max_value: Максимальное значение.
        """
        self._code = code
        self._min_value = min_value
        self._max_value = max_value

    def get_code(self):
        """
        Возвращает код параметра

        @return: str
        """
        return self._code

    def get_min_value(self):
        """
        Возвращает минимальное значение параметра

        @return: str
        """
        return self._min_value

    def get_max_value(self):
        """
        Возвращает максимальное значение параметра

        @return: str
        """
        return self._max_value