#coding:utf-8
import threading
import re
import json
import inspect
import time
import datetime
import uuid # для генерации уникальных идентификаторов

from django.conf import settings
from django.utils.importlib import import_module
from django.utils.datastructures import MultiValueDict
from django import http

from m3.helpers.datastructures import MutableList
from m3.core.json import M3JSONEncoder
from m3.helpers import ui as ui_helpers
from m3.ui.ext.base import BaseExtComponent

#===============================================================================
# Внутренняя таблица урлов
#===============================================================================
__urltable = {}

class ActionResult(object):
    '''
    Класс описывает результат выполнения Action'а
    
    Данный класс является абстрактным.
    '''
    
    def __init__(self, data = None, http_params = {}):
        '''
        @param data: данные, на основе которых будет сформирован результат выполнения действия. 
                     Тип объекта, передаваемого через data зависит от дочернего результата
        '''
        self.data = data
        self.http_params = http_params
        
    def get_http_response(self):
        '''
        Переопределяемый в дочерних классах метод.
        '''
        raise NotImplementedError()
    
    def process_http_params(self, response):
        for k, v in self.http_params.items():
            response[k] = v
        return response
              
        
    
class PreJsonResult(ActionResult):
    '''
    Результат выполнения операции в виде, например, списка объектов, 
    готовых к сериализации в JSON формат и отправке в response.
    Для данного класса в self.data храниться список некоторых объектов. 
    Метод self.get_http_response выполняет сериализацию этих данных в строковый формат.
    '''
    def __init__(self, data = None, secret_values = False):
        super(PreJsonResult, self).__init__(data)
        self.secret_values = secret_values
    
    def get_http_response(self):
        encoder = M3JSONEncoder()
        result = encoder.encode(self.data)
        response = http.HttpResponse(result, mimetype='application/json')
        if self.secret_values:
            response['secret_values'] = True
        return response

class JsonResult(ActionResult):
    '''
    Результат выполнения операции в виде готового JSON объекта для возврата в response.
    Для данного класса в self.data храниться строка с данными JSON объекта.
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data, mimetype='application/json')

class ExtGridDataQueryResult(ActionResult):
    '''
    Результат выполнения операции, который выдает данные в формате, пригодном для 
    отображения в гриде
    '''
    def __init__(self, data=None, start = -1, limit = -1):
        super(ExtGridDataQueryResult, self).__init__(data)
        self.start = start
        self.limit = limit
        
    def get_http_response(self):
        return http.HttpResponse(ui_helpers.paginated_json_data(self.data, self.start, self.limit))

class HttpReadyResult(ActionResult):
    '''
    Результат выполнения операции в виде готового HttpResponse. 
    Для данного класса в self.data храниться объект класса HttpResponse.
    '''
    def get_http_response(self):
        return self.data
    
class TextResult(ActionResult):
    '''
    Результат, данные которого напрямую передаются в HttpResponse
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data)


class ExtAdvancedTreeGridDataQueryResult(ActionResult):
    '''
    Результат выполнения операции в формате, удобным для отображения в 
    Ext.m3.AdvancedTreeGrid
    '''
    def __init__(self, data=None, start = -1, limit = -1):
        super(ExtAdvancedTreeGridDataQueryResult, self).__init__(data)
        self.start = start
        self.limit = limit
    
    def get_http_response(self):
        return http.HttpResponse(ui_helpers.mptt_json_data(self.data, 
                                                           self.start, 
                                                           self.limit),
                                 mimetype='application/json')

#===============================================================================
# Результаты выполнения операции с заданным контекстом 
#===============================================================================

class BaseContextedResult(ActionResult):
    '''
    Абстрактный базовый класс, который оперирует понятием результата 
    выполнения операции, 'отягощенного некоторым контектом'
    '''
    def __init__(self, data = None, context = None, http_params = {}):
        super(BaseContextedResult, self).__init__(data, http_params)
        self.set_context(context)
            
    def set_context(self, context):
        if isinstance(context, ActionContext):
            # в случае если задан реальный результат выполнения операции, то его и регистрируем
            self.context = context
        else:
            # иначе пытаемся построить ActionContext на основе переданного объекта context
            self.context = ActionContext(context)
    

class ExtUIComponentResult(BaseContextedResult):
    '''
    Результат выполнения операции, описанный в виде отдельного компонента пользовательского интерфейса.
    В self.data хранится некоторый наследник класса m3.ui.ext.ExtUiComponent.
    Метод get_http_response выполняет метод render у объекта в self.data.
    '''
    def get_http_response(self):
        self.data.action_context = self.context
        return http.HttpResponse(self.data.render())
    
        

class ExtUIScriptResult(BaseContextedResult):
    '''
    По аналогии с ExtUiComponentResult, представляет собой некоторого наследника класса ExtUiComponent.
    Единственное отличие заключается в том, что get_http_response должен сформировать
    готовый к отправке javascript. Т.е. должен быть вызван метод self.data.get_script()
    '''
    def __init__(self, data = None, context = None, http_params = {}, secret_values = False):
        super(ExtUIScriptResult, self).__init__(data, context, http_params)
        self.secret_values = secret_values
    
    def get_http_response(self):
        self.data.action_context = self.context
        response = http.HttpResponse(self.data.get_script())
        
        response = self.process_http_params(response)
        
        if self.secret_values:
            response['secret_values'] = True
        return response
    
class OperationResult(ActionResult):
    '''
    Результат выполнения операции, описанный в виде Ajax результата ExtJS: success или failure.
    
    @param success: True в случае успешного завершения операции, False - в противном случае
    @param message: сообщение, поясняющее результат выполнения операции
    @param code: текст javascript, который будет выполнен на клиенте в результате обработки результата операции
    '''
    def __init__(self, success = True, code = '', message = '', *args, **kwargs):
        super(OperationResult, self).__init__(*args, **kwargs)
        # Результат выполнения операции: успех/неудача
        self.success = success
        # Сообщение об ошибке выводимое при неудаче
        self.message = message
        # Произвольный JS код, который выполняется в любом случае если задан
        self.code = code
    
    @staticmethod
    def by_message(message):
        '''
        Возвращает экземпляр OperationResult построенный исходя из сообщения message.
        Если операция завершилась успешно, то сообщение должно быть пустым.
        
        @deprecated: Непонятно что это такое..
        '''
        result = OperationResult(success = True)
        if message:
            result.success = False
            result.message = message
        return result
    
    def get_http_response(self):
        '''
        Возвращает объект HttpResponse, соответствующий данному результату выполнения операции
        '''
        result = {}
        result['message'] = self.message
        result['success'] = True if self.success else False
        result = json.JSONEncoder().encode(result)
        
        # Вставляем функцию прямо в JSON без кодирования
        if self.code:
            self.code = self.code.strip()
            if self.code[len(self.code)-2:len(self.code)] == '()':
                code = ' ,"code": %s' % self.code[:-2]
            else:
                code = ' ,"code": %s' % self.code
            result = result[:-1] + code + result[-1]
        
        repsonse = http.HttpResponse(result)
        repsonse = self.process_http_params(repsonse)
        return repsonse

class ActionContextDeclaration(object):
    '''
    Класс, который декларирует необходимость наличия определенного параметра в объекте контекста
    '''
    def __init__(self, name='', default=None, type=None, required=False, verbose_name = '', *args, **kwargs):
        '''
        Создает экземпляр
        '''
        self.name = name
        self.default = default
        self.required = required
        self.type = type
        self.verbose_name = verbose_name
        
    def human_name(self):
        '''
        Выводит человеческое название параметра
        '''
        return self.verbose_name if self.verbose_name else self.name

class ActionContext(object):
    '''
    Контекст выполнения операции, восстанавливаемый из запроса.
    '''
    class RequiredFailed(Exception):
        '''
        Исключительная ситуация, которая выбрасывается в случае
        если фактическое наполнение контекста действия не соответствует
        описанным правилам
        '''
        def __init__(self, reason):
            self.reason = reason
                    
    def __init__(self, obj=None):
        '''
        В зависимости от типа obj выполняем построение объекта контекста действия
        '''
        pass
    
    def convert_value(self, raw_value, arg_type):
        ''' Возвращает значение преобразованное в заданный формат '''
        value = None
        if arg_type == int:
            value = int(raw_value)
            
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
            
        else:
            raise Exception('Can not convert value of "%s" in a given type "%s"' % (raw_value, arg_type))
        
        return value
    
    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов согласно переданному request
        '''
        params = {}
        if rules:
            for rule in rules:
                params[rule.name] = [rule.type, False] # [тип параметра; признак того, что параметр включен в context]
        
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
        result = ''
        for k,v in self.__dict__.items():
            if isinstance(v, int):
                result += '"%s": %s,' % (k,v)
            elif isinstance(v, datetime.datetime):
                result += '"%s": "%s",' % (k, v.strftime('%d.%m.%Y'))
            elif isinstance(v, datetime.time):
                result += '"%s": "%s",' % (k, v.strftime('%H:%M'))
            else:
                try:
                    result += '"%s": "%s",' % (k,str(v))
                except:
                    # TODO: обрабатывать все типы параметров
                    pass
        if result:
            result = result[:-1]
        return '{' + result + '}'
   
    
class Action(object):
    '''
    Базовый класс описания Action'а в системе (аналог вьюшки)
    '''
    
    # Часть адреса запроса которая однозначно определяет его принадленость к конкретному Action'у
    url = ''
    
    # Ссылка на ActionPack к которому принадлежит данный Action
    parent = None
    
    # Ссылка на контроллер к которому принадлежит данный Action
    controller = None
    
    def pre_run(self, request, context):
        '''
        Предварительная обработка входящего запроса (request) и контекста (context)
        перед передачений на исполнение
        '''
        pass
    
    def post_run(self, request, context, response):
        '''
        Постобработка результата работы Action'а
        '''
        pass
    
    def context_declaration(self):
        '''
        Метод декларирует необходимость наличия определенных параметров в контексте
        выполнения данной операции
        '''
        pass
    
    def run(self, request, context):
        '''
        Обеспечивает непосредственное исполнение запроса, аналог views в Django.
        Обязательно должен быть перекрыт наследником
        '''
        raise NotImplementedError()
    
    @classmethod
    def absolute_url(cls):
        '''
        Возвращает полный путь до действия.
        НО при условии что этот экшен используется ТОЛЬКО В ОДНОМ ПАКЕ И КОНТРОЛЛЕРЕ, иначе валим всех!
        Ищет перебором!
        '''
        url = ControllerCache.get_action_url(cls)
        if not url:
            raise Exception('Action not registered in any controller/pack')
        return url
  
    def get_packs_url(self):
        '''
        Возвращает путь всех паков на пути к экшену
        '''
        assert isinstance(self.parent, ActionPack)
        path = []
        pack = self.parent
        while pack != None:
            path.append(pack.url)
            pack = pack.parent
        return ''.join( reversed(path) )
    
    def get_absolute_url(self):
        '''
        Возвращает полный путь от хоста до конечного экшена
        @deprecated: Дублирует absolute_url 
        '''
        #TODO: Переписать, т.к. этот код дублирует функции контроллера
        assert isinstance(self.controller, ActionController)
        # Очищаем от мусора рег. выр.
        ignored_chars = ['^', '&', '$']
        for char in ignored_chars:
            url = self.url.replace(char, '')
        return self.controller.url + self.get_packs_url() + url


class ActionPack(object):
    '''
    Базовый класс управления набором схожих по смыслу действий
    '''
    url = ''
    # Список действий зарегистрированных на исполнение в данном пакете
    actions = []
    
    # Список дочерних пакетов (подпакетов) зарегистрированных на исполнение в данном пакете
    subpacks = []
    
    # Ссылка на вышестоящий пакет, тот в котором зарегистрирован данный пакет
    parent = None
    
    def pre_run(self, request, context):
        '''
        Обработка входящего запроса HttpRequest перед передачений 
        на исполнение соответствующему Action'у
        '''
        pass
    
    def post_run(self, request, context, response):
        '''
        Обработка исходящего ответа HttpResponse после исполнения запроса
        соответствующим Action'ом
        '''
        pass
    
class WrapException(Exception):
    '''
    Исключение возникает при неуданой обертке экшена или пака
    '''
    pass

class ActionController(object):
    '''
    Класс коонтроллер - обеспечивает обработку пользовательских запросов путем передачи
    их на исполнение соответствущим Action'ам
    '''
    
    class FakePacks:
        pass
    
    def __init__(self, url = ''):
        '''
        url - используется для отсечения лишней части пути в запросе, поскольку
              управление в пак передается из вьюшки
        '''
        # ДЛЯ СОВМЕСТИМОСТИ.
        # Имитирует список паков торчащий наружу
        self.packs = self.FakePacks()
        self.packs.append = self.append_pack
        self.packs.extend = self.extend_packs
        
        # Используется для отсечения лишней части пути в запросе
        self.url = url
        
        # Словарь для быстрого разрешения запросов. Состоит из полного пути запроса, списка 
        # вызываемых паков и экшена. Пример: {'/dict/lpu/get_rows': ([DictPack, LPUPack], RowsAction)}
        self._url_patterns = {}
        
        # Словари для быстрого поиска паков по имени и классу, например: {'DictPack', <DictPack instance at 0x01FBACB0>}
        self._packs_by_name = {}
        self._packs_by_type = {}
        self._actions_by_type = {}
        
        # Блокировка для перестроения паттернов урлов
        self._rebuild_lock = threading.RLock()
        
        # Признак того, что контроллер зарегистрирован во внутреннем кеше
        self._registered = False
        
    def _add_pack_to_search_dicts(self, pack):
        '''
        Добавляет экшен в словари для быстрого доступа
        '''
        assert isinstance(pack, ActionPack)
        self._packs_by_name[pack.__class__.__name__] = pack
        self._packs_by_type[pack.__class__] = pack
    
    def _load_class(self, full_path):
        '''
        По полному пути загружает и созвращает класс 
        '''
        # Получаем имя модуля и класса в нём
        dot = full_path.rindex('.')
        mod_name = full_path[:dot]
        pack_name = full_path[dot + 1:]
        # Пробуем загрузить
        mod = import_module(mod_name)
        clazz = getattr(mod, pack_name)
        return clazz
    
    def _build_pack_node(self, clazz, stack):
        # Что-бы нам не передали, нужно создать экземпляр
        if isinstance(clazz, str):
            clazz = self._load_class(clazz)()
        elif inspect.isclass(clazz):
            clazz = clazz()
        
        # Присваиваем родителя
        if len(stack) > 0:
            clazz.parent = stack[-1]
        
        if isinstance(clazz, ActionPack):
            # Для быстрого поиска
            self._add_pack_to_search_dicts(clazz)
            
            stack.append(clazz)
            # Бежим по экшенам
            for action in clazz.actions:
                self._build_pack_node(action, stack)
            # Бежим по пакам
            for pack in clazz.subpacks:
                self._build_pack_node(pack, stack)
            stack.pop()
        else:
            # Для быстрого поиска
            self._actions_by_type[clazz.__class__] = clazz
            
            clazz.controller = self
            full_path = self._build_full_path(stack, clazz)
            self._url_patterns[full_path] = (stack[:], clazz)
    
    def _invoke(self, request, action, stack):
        '''
        Непосредственный вызов экшена с отработкой всех событий
        '''
        # Заполняем контект
        rules = action.context_declaration()
        context = self.build_context(request)
        context.build(request, rules)
        
        # проверяем контекст
        try:
            context.check_required(rules)
        except ActionContext.RequiredFailed, e:
            # если контекст неправильный, то возвращаем 
            # фейльный результат операции
            return OperationResult(success = False, message = u'Не удалось выполнить операцию. Не задан обязательный<br>параметр: ' + e.reason)

        # В request заносим информацию о паках и экшене, которые будут
        # выполнены в процессе обработки запроса
        request.target_packs = stack
        request.target_action = action

        # Все ПРЕ обработчики
        for pack in stack:
            result = pack.pre_run(request, context)
            if result != None:
                return result
        # Сам экшен
        result = action.pre_run(request, context)
        if result != None:
            return result
        response = action.run(request, context)
        result = action.post_run(request, context, response)
        if result != None:
            return result
        # Все ПОСТ обработчики с конца
        for pack in reversed(stack):
            result = pack.post_run(request, context, response)
            if result != None:
                return result
        # по возможности запихиваем текущий контекст в response
        if isinstance(response, BaseContextedResult):
            response.set_context(context)
        return response
    
    def process_request(self, request):
        '''
        Обработка входящего запроса от клиента. Обрабатывается по аналогии с UrlResolver'ом Django
        '''
        ControllerCache.populate()

        path = request.path
        matched = self._url_patterns.get(path)
        if matched:
            stack, action = matched
            result = self._invoke(request, action, stack)
            if isinstance(result, ActionResult):
                return result.get_http_response()
            return result

        #self.dump_urls()
        raise http.Http404()
    
    def build_context(self, request):
        '''
        Выполняет построение контекста вызова операции ActionContext на основе переданного request
        '''
        return ActionContext()
    
    def get_action_url(self, action):
        '''
        Возвращает полный URL адрес для класс экшена 
        '''
        assert issubclass(action, Action)
        for path, value in self._url_patterns.items():
            act = value[1]
            if isinstance(act, action):
                return path
    
    #========================================================================================
    # Методы, предназначенные для поиска экшенов и паков в контроллере
    #========================================================================================
    def find_pack(self, type):
        '''
        Ищет экшенпак внутри иерархии котроллера. Возвращает его экземпляр или None если не находит.
        type может быть классом или строкой с названием класса
        '''
        # Нужно ли оно тут?
        ControllerCache.populate()

        if isinstance(type, str):
            return self._packs_by_name.get(type)
        elif issubclass(type, ActionPack):
            return self._packs_by_type.get(type)
        else:
            raise ValueError('Wrong type of argument %s' % type)

    #========================================================================================
    # Методы, предназначенные для добавления/изменения/удаления пакетов действий в контроллер
    #========================================================================================
    def append_pack(self, pack):
        '''
        Добавляет ActionPack в контроллер.
        @param pack: объект типа ActionPack, который необходимо добавить в контроллер
        '''
        self._build_pack_node(pack, [])
        ControllerCache.register_controller(self)
        
    def extend_packs(self, packs):
        '''
        Производит массовое добавление экшенпаков в контроллер.
        @param packs: список объектов типа ActionPack, которые необходимо зарегистрировать в контроллере
        '''
        for pack in packs:
            self.append_pack(pack)
        
    def remove_pack(self, type):
        '''
        Удаляет экшенпак из иерархии контроллера. Возвращает истину в случае успеха.
        @param type: Класс экшенпака для удаления.
        '''
        raise NotImplementedError()
        assert issubclass(type, ActionPack)
        
        # Получаем экземпляр пака, иначе его не можут быть в нашем контроллере
        pack = self._packs_by_type.get(type)
        if pack:
            # Удаляем все паттерны урлов в стеке которых есть наш пак
            for path, value in self._url_patterns.items():
                stack = value[0]
                if pack in stack:
                    del self._url_patterns[path]
            
            # Удаляем из словарей поиска
            del self._packs_by_type[type]
            del self._packs_by_name[type.__name__]
            for action in pack.actions:
                del self._actions_by_type[action.__class__]
        
            return True    

    def _norm_url(self, url):
        '''
        Очищает части адреса от мусора.
        Раньше были планы использовать регулярные выражения в адресах, сейчас остался мусор от них.
        '''
        for char in ['^', '&', '$', '/']:
            if url.startswith(char):
                url = url[1:]
            if url.endswith(char):
                url = url[:-1]
        return '/' + url if url else ''

    def _build_full_path(self, packs_list, final_action):
        '''
        Возвращает полный адрес от контроллера через паки до конечного экшена. 
        '''
        return self._norm_url(self.url) + ''.join([self._norm_url(x.url) for x in packs_list]) + self._norm_url(final_action.url)

    def wrap_pack(self, dest_pack, wrap_pack):
        '''
        Вставляет экшенпак wrap_pack внутрь иерархии перед dest_pack.
        Таким образом можно перехватывать запросы и ответы пака dest_pack.
        
        Допустим есть цепочка паков:
           A1 - X - A2 - A3    |   A1 - Y - X - A2 - A3
           B1 - B2 - X         |   B1 - B2 - Y - X
           X - C1 - C2         |   Y - X - C1 - C2
        Для решения нужно:
        1. Найти экземпляры пака X
        2. В цепочку вместо X вставить Y->X c учетом левых и правых участников
        3. Перестроить адреса пробежавшись по цепочке
        
        @param dest_pack: Пак который будем оборачивать
        @param wrap_pack: Оборачивающий пак
        '''
        assert issubclass(dest_pack, ActionPack) and issubclass(wrap_pack, ActionPack)
        
        wrapper = wrap_pack()
        self._add_pack_to_search_dicts(wrapper)
        new_patterns = {}
        current_packs_slice = None
        
        for url, value in self._url_patterns.iteritems():
            packs_list, final_action = value
            
            # Поиск пака и соседей в списке
            left_pack = right_pack = None
            for pos, pack in enumerate(packs_list):
                if pack.__class__ == dest_pack:
                    if pos > 0:
                        left_pack = packs_list[pos - 1]
                    if pos + 1 < len(packs_list):
                        right_pack = packs_list[pos + 1]
                    break
            else:
                # Просто копируем
                new_patterns[url] = value
                continue
            
            # Мутация соседей
            pack.parent = wrapper
            packs_list.insert(pos, wrapper)
            if left_pack:
                wrapper.parent = left_pack
            if right_pack:
                right_pack.parent = wrapper
                
            # Создание нового урла
            full_path = self._build_full_path(packs_list, final_action)
            new_patterns[full_path] = (packs_list[:], final_action)
            current_packs_slice = packs_list[:pos + 1]
            
        self._url_patterns = new_patterns
        
        # У враппера могут быть собственные экшены и паки. Их тоже нужно построить.
        if current_packs_slice:
            for subpack in wrapper.subpacks:
                self._build_pack_node(subpack, current_packs_slice)
            for action in wrapper.actions:
                self._build_pack_node(action, current_packs_slice)
        else:
            raise WrapException('ActionPack %s not found in controller' % dest_pack)
        
    
    def wrap_action(self, dest_pack, dest_action, wrap_pack):
        '''
        Вставляет перед экшеном dest_action входящим в пак dest_pack промежуточный пак wrap_pack.
        
        ВНИМАНИЕ! Экшены как правило обращаются к своим пакам через атрибут "parent", поэтому вероятно 
        будут возникать ошибки из-за того, что оборачивающий пак не предоставляет методы изначального пака.
        Оборачивающий пак можно наследовать от оригинального, но тогда вместо оборачивая целесообразно
        использовать подмену паков.        
        
        @param dest_pack: Пак в который входит оборачиваемый экшен
        @param dest_action: Оборачиваемый экшен
        @param wrap_pack: Оборачивающий пак
        '''
        assert issubclass(dest_pack, ActionPack) and issubclass(wrap_pack, ActionPack)
        assert issubclass(dest_action, Action)
        
        wrapper = wrap_pack()
        self._add_pack_to_search_dicts(wrapper)
        new_patterns = {}
        current_packs_slice = None
        
        for url, value in self._url_patterns.iteritems():
            packs_list, final_action = value
            
            # Поиск исходного пака и экшена в нём
            last_pack = packs_list[-1]
            if last_pack.__class__ == dest_pack and final_action.__class__ == dest_action:
                # Вставка
                packs_list.append(wrapper)
                wrapper.parent = last_pack
                final_action.parent = wrapper
                
                # Создание нового урла
                full_path = self._build_full_path(packs_list, final_action)
                new_patterns[full_path] = (packs_list[:], final_action)
                current_packs_slice = packs_list
                
            else:
                # Просто копируем
                new_patterns[url] = value
            
        self._url_patterns = new_patterns
            
        if current_packs_slice:
            # У враппера могут быть собственные экшены и паки. Их тоже нужно построить.
            for subpack in wrapper.subpacks:
                self._build_pack_node(subpack, current_packs_slice)
            for action in wrapper.actions:
                self._build_pack_node(action, current_packs_slice)
        else:
            raise WrapException('ActionPack %s not found in controller' % dest_pack)
            
    
    def dump_urls(self):
        '''
        Отладочный метод. Выводит список всех адрес зарегистрированных в контроллере.
        '''
        print '==== CONTROLLER WITH URL: %s ======' % self.url
        for key in sorted(self._url_patterns.keys()):
            print key
        print
        

class ControllerCache(object):
    '''
    Внутренний класс платформы, который отвечает за хранение кеша контроллеров и связанных
    с ним экшенов и паков.
    '''
    _loaded = False
    _write_lock = threading.RLock()
    
    # словарь зарегистрированных контроллеров в прикладном приложении
    _controllers = set()
        
    @classmethod
    def get_action_url(cls, type):
        ''' Возвращает URL экшена по его классу '''
        assert issubclass(type, Action)
        for cont in cls._controllers:
            url = cont.get_action_url(type)
            if url:
                return url
    
    @classmethod
    def register_controller(cls, controller):
        '''
        Выполняет регистрацию контроллера во внутреннем кеше.
        '''
        assert isinstance(controller, ActionController)
        cls._write_lock.acquire()
        try:
            cls._controllers.add(controller)
        finally:
            cls._write_lock.acquire()

    @classmethod
    def populate(cls):
        if cls._loaded:
            return False
        cls._write_lock.acquire()
        try:
            if cls._loaded:
                return False
            # Из инитов всех приложения пытаемся выполнить register_ui_actions
            for app_name in settings.INSTALLED_APPS:
                try:
                    module = import_module('.app_meta', app_name)
                except ImportError, err:
                    if err.args[0].find('No module named') == -1:
                        raise
                    continue
                proc = getattr(module, 'register_actions', None)
                if callable(proc):
                    proc()
            cls._loaded = True
        finally:
            cls._write_lock.release()
        return True

    @classmethod
    def dump_urls(cls):
        '''
        Отладочный метод. Выводит адреса всех контроллеров зарегистрированных в кэше.
        '''
        print '------------ CONTROLLER CACHE DUMP ------------'
        for cont in cls._controllers:
            cont.dump_urls()
