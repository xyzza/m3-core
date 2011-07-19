#coding:utf-8
'''
Модуль, реализущий работу с контекстом выполнения операции

@author: akvarats
'''
import datetime
import json
from decimal import Decimal

from m3.helpers import logger


#==================================== ИСКЛЮЧЕНИЯ ===========================================

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
    Исключение, которое выбрасывается если значение из запроса *value*
    не удалось привести к типу *type* указанному в правиле ActionContextDeclaration
    """
    def __init__(self, value, type, *args, **kwargs):
        super(ConversionFailed, self).__init__(*args, **kwargs)
        self.value = value
        self.type = type

    def __str__(self):
        return u'Can not convert value of "%s" in a given type "%s"' % (self.value, self.type)

#====================================== КЛАССЫ =============================================

class ActionContextDeclaration(object):
    """
    Класс, который определяет правило извлечения параметра с именем *name* из
    запроса и необходимость его наличия в объекте контекста ActionContext.
    *default* - значение параметра по умолчанию, используется если его нет
    в запросе, но наличие обязательно.
    *type* - тип извлекаемого значения.
    *required* - указывает что параметр обязательный.
    *verbose_name* - человеческое имя параметра, необходимо для сообщений об ошибках.
    """
    def __init__(self, name='', default=None, type=None, required=False, verbose_name='', *args, **kwargs):
        assert type, 'type must be defined!'
        self.name = name
        self.default = default
        self.required = required
        self.type = type
        self.verbose_name = verbose_name

    def human_name(self):
        """ Возвращает человеческое название параметра *verbose_name* """
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

    def __init__(self, obj=None):
        '''
        В зависимости от типа obj выполняем построение объекта контекста действия
        '''
        pass

    def convert_value(self, raw_value, arg_type):
        ''' Возвращает значение *raw_value* преобразованное в заданный тип *arg_type* '''
        value = None
        if arg_type == int:
            value = int(raw_value)
            
        elif arg_type == float:
            value = float(raw_value)
            
        elif arg_type == Decimal:
            value = Decimal(raw_value)
            
        elif arg_type in [str, unicode]:
            value = unicode(raw_value)

        elif arg_type == datetime.datetime:
            # Дата может прийти либо в Немецком формате, 
            # либо в дефолтном ExtJS формате 2010-06-21T00:00:00
            if 'T' in raw_value:
                value = datetime.datetime.strptime(raw_value[:10], '%Y-%m-%d')
            else:
                value = datetime.datetime.strptime(raw_value, '%d.%m.%Y')

        elif arg_type == datetime.date:
            if 'T' in raw_value:
                value = datetime.datetime.strptime(raw_value[:10], '%Y-%m-%d')
            else:
                value = datetime.datetime.strptime(raw_value, '%d.%m.%Y')
            value = value.date()

        elif arg_type == datetime.time:
            d = datetime.datetime.strptime(raw_value, '%H:%M')
            value = datetime.time(d.hour, d.minute, 0)

        elif arg_type == bool:
            value = raw_value in ['true', 'True', 1, '1', 'on', True]
        
        elif isinstance(arg_type, ActionContext.ValuesList):
            elements = raw_value.split(arg_type.separator)
            if not arg_type.allow_empty:
                elements = [elem for elem in elements if elem]
            value = map(arg_type.type, elements)

        elif arg_type == object:
            # обработаем объект как JSON
            value = json.loads(raw_value)

        else:
            raise ConversionFailed(value=raw_value, type=arg_type)

        return value

    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов согласно переданному *request*
        исходя из списка правил *rules*
        '''
        params = {}
        if rules:
            for rule in rules:
                params[rule.name] = [rule.type, False] # [тип параметра; признак того, что параметр включен в context]

        try:
            # переносим параметры в контекст из запроса
            for key in request.REQUEST:
                value = request.REQUEST[key]
                # Пустые параметры не конвертируем, т.к. они могут вызвать ошибку
                if not value:
                    continue
                # 
                if params.has_key(key):
                    value = self.convert_value(value, params[key][0])
                    # Флаг того, что параметр успешно расшифрован и добавлен в контекст
                    params[key][1] = True
                setattr(self, key, value)
        except IOError as err:
            # В некоторых браузерах (предполагается что в ie) происходит следующие:
            # request.REQUEST читается и в какой-то момент связь прекращается
            # из-за того, что браузер разрывает соединение, в следствии этого происходит ошибка 
            # IOError: request data read error
            logger.warning(str(err))
        except ValueError as err:
            # если ошибка преобразования, то пусть проставится значение по-умолчанию
            pass

        # переносим обязательные параметры, которые не встретились в запросе
        for rule in rules if rules else []:
            if rule.required and rule.default != None and not params[rule.name][1]:
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
                result = unicode(repr(obj))
                
            return result
        
        return json.dumps(self.__dict__, default=encoder_extender)
