#coding:utf-8
'''
Модуль, реализущий работу с контекстом выполнения операции

@author: akvarats
'''
import datetime
import json
from decimal import Decimal

from django.utils.encoding import force_unicode

from m3.helpers import logger


#============================= ИСКЛЮЧЕНИЯ =====================================
class ActionContextException(Exception):
    """ Базовый класс для исключений контекста """
    pass


class RequiredFailed(ActionContextException):
    '''
    Исключительная ситуация, которая выбрасывается в случае
    если фактическое наполнение контекста действия не соответствует
    описанным правилам
    '''
    def __init__(self, reason):
        self.reason = reason


class ConversionFailed(ActionContextException):
    """
    Исключение, которое выбрасывается,
    если значение из запроса *value*
    не удалось привести к типу *type*,
    указанному в правиле ActionContextDeclaration
    """
    def __init__(self, value, type, *args, **kwargs):
        super(ConversionFailed, self).__init__(*args, **kwargs)
        self.value = value
        self.type = type

    def __str__(self):
        return u'Can not convert value of "%s" in a given type "%s"' % (
            self.value, self.type)


#================================== ПАРСЕРЫ ===================================
def _make_datetime_parser(extractor, formats):
    def parse(value):
        for (fmt, length) in formats:
            try:
                result = extractor(
                    datetime.datetime.strptime(value[:length], fmt)
                )
                break
            except ValueError:
                pass
        else:
            raise AssertionError()
        return result
    return parse


def _make_simple_parser(result_type, exceptions=(ValueError, TypeError)):
    def parse(value):
        try:
            result = result_type(value)
        except exceptions:
            raise AssertionError()
        return result
    return parse


def _object_parser(value):
    try:
        result = json.loads(value)
    except ValueError:
        raise AssertionError()
    return result


def _bool_parser(value):
    return value in ('true', 'True', 1, '1', 'on', True)


_PARSERS = {
    str: _make_simple_parser(str),
    unicode: _make_simple_parser(unicode),
    int: _make_simple_parser(int),
    float: _make_simple_parser(float),
    Decimal: _make_simple_parser(Decimal),

    object: _object_parser,

    bool: _bool_parser,

    datetime.datetime: _make_datetime_parser(lambda x: x, formats=(
        ('%Y-%m-%dT%H:%M:%S', 19),
        ('%Y-%m-%d %H:%M:%S', 19),
        ('%d.%m.%Y %H:%M:%S', 19),
        ('%Y-%m-%dT%H:%M', 16),
        ('%Y-%m-%d %H:%M', 16),
        ('%d.%m.%Y %H:%M', 16),
    )),

    datetime.date: _make_datetime_parser(lambda x: x.date(), formats=(
        ('%Y-%m-%d', 10),
        ('%d.%m.%Y', 10),
        ('%m/%d/%Y', 10),
    )),

    datetime.time: _make_datetime_parser(lambda x: x.time(), formats=(
        ('%H:%M:%S', 8),
        ('%H:%M', 5),
    )),
}


#================================== КЛАССЫ ====================================
class ActionContextDeclaration(object):
    """
    Класс, который определяет правило извлечения параметра с именем *name* из
    запроса и необходимость его наличия в объекте контекста ActionContext.
    *default* - значение параметра по умолчанию, используется если его нет
    в запросе, но наличие обязательно.
    *type* - тип извлекаемого значения.
    *required* - указывает что параметр обязательный.
    *verbose_name* - человеческое имя параметра,
    необходимо для сообщений об ошибках.
    """
    def __init__(self, name='', default=None, type=None,
            required=False, verbose_name='', *args, **kwargs):
        assert type, 'type must be defined!'
        self.name = name
        self.default = default
        self.required = required
        self.type = type
        self.verbose_name = verbose_name

    def human_name(self):
        """
        Возвращает человеческое название параметра *verbose_name*
        """
        return self.verbose_name if self.verbose_name else self.name


class ActionContext(object):
    '''
    Контекст выполнения операции, восстанавливаемый из запроса.
    '''
    # Для совместимости
    RequiredFailed = RequiredFailed

    class ValuesList():
        '''
        Класс для описания параметров, которые будут передаваться в виде
        списка значений, разделенных определенным символом
        '''
        def __init__(self, separator=',', type=int, allow_empty=True):
            # разделитель элементов
            self.separator = separator
            # тип, к которому будут преобразовываться эл-ты списка
            self.type = type
            self.allow_empty = allow_empty

    def __init__(self, **kwargs):
        '''
        Параметры kwargs для быстрой инициализации
        '''
        for k, v in kwargs.items():
            setattr(self, k, v)

    def convert_value(self, raw_value, arg_type):
        '''
        Возвращает значение *raw_value*,
        преобразованное в заданный тип *arg_type*
        '''
        try:
            if isinstance(arg_type, ActionContext.ValuesList):
                elements = raw_value.split(arg_type.separator)
                if not arg_type.allow_empty:
                    elements = [elem for elem in elements if elem]
                value = [
                    self.convert_value(e, arg_type.type)
                    for e in elements
                ]
            else:
                if not arg_type in _PARSERS:
                    raise TypeError('Unknown parser "%r"!' % arg_type)
                value = _PARSERS[arg_type](raw_value)
        except AssertionError:
            raise ConversionFailed(value=raw_value, type=arg_type)

        return value

    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов
        согласно переданному *request*, исходя из списка правил *rules*
        '''
        params = {}
        if rules:
            for rule in rules:
                # [тип параметра; признак того, что параметр включен в context]
                params[rule.name] = [rule.type, False]

        key = value = ptype = None
        try:
            # переносим параметры в контекст из запроса
            for key in request.REQUEST:
                value = request.REQUEST[key]
                # Пустые параметры не конвертируем,
                # т.к. они могут вызвать ошибку
                if not value:
                    continue

                if key in params:
                    ptype = params[key][0]
                    value = self.convert_value(value, ptype)
                    # Флаг того, что параметр успешно расшифрован
                    # и добавлен в контекст
                    params[key][1] = True
                setattr(self, key, value)
        except IOError as err:
            # В некоторых браузерах (предполагается что в ie)
            # происходит следующие:
            # request.REQUEST читается и в какой-то момент связь прекращается
            # из-за того, что браузер разрывает соединение,
            # в следствии этого происходит ошибка
            # IOError: request data read error
            logger.warning(str(err))
        except ValueError as err:
            # если ошибка преобразования,
            # то пусть проставится значение по-умолчанию
            logger.exception(
                u'Ошибка при преобразовании значения '
                u'из запроса %s="%s" к типу "%s"'
                % (key, value, ptype)
            )

        # переносим обязательные параметры, которые не встретились в запросе
        for rule in rules if rules else []:
            if rule.required and rule.default != None and (
                    not params[rule.name][1]):
                # если параметр не передан в запросе, но
                # он является обязательным и задано значение по умолчанию,
                # то помещаем этот параметр в контекст
                setattr(self, rule.name, rule.default)

    def check_required(self, rules):
        '''
        Проверяет наличие обязательных параметров
        '''
        if not rules:
            return
        for rule in rules:
            if rule.required and getattr(self, rule.name, None) == None:
                raise ActionContext.RequiredFailed(rule.human_name())

    def json(self):
        '''
        Рендеринг контекста в виде javascript объекта
        '''
        def encoder_extender(obj):
            if isinstance(obj, datetime.datetime):
                result = obj.strftime('%d.%m.%Y')
            # WTF? А где время в верхней строке?
            if isinstance(obj, datetime.date):
                result = obj.strftime('%d.%m.%Y')
            elif isinstance(obj, datetime.time):
                result = obj.strftime('%H:%M')
            else:
                result = force_unicode(obj)

            return result

        return json.dumps(self.__dict__, default=encoder_extender)

    def combine(self, context):
        """
        Объединение контекстов друг с другом
        Дополнение собственного контекста! Существующие значания не заменяются!
        Выдается новый контекст!!!
        Пример: ac = ActionContext(a=1, b=2).combine(ActionContext(c=3,a=2))
                ac.json()
                {"a": 1, "c": 3, "b": 2}
        """
        result = ActionContext()
        if context:
            result.__dict__.update(context.__dict__)
        result.__dict__.update(self.__dict__)
        return result
