#coding:utf-8
import threading
import re
import json
import inspect

from django.conf import settings
from django.utils.importlib import import_module
from django.utils.datastructures import MultiValueDict
from django import http

from m3.helpers.datastructures import MutableList
from m3.core.json import M3JSONEncoder
from m3.ui.ext.base import BaseExtComponent
import datetime

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
        response = http.HttpResponse(result)
        if self.secret_values:
            response['secret_values'] = True
        return response

class JsonResult(ActionResult):
    '''
    Результат выполнения операции в виде готового JSON объекта для возврата в response.
    Для данного класса в self.data храниться строка с данными JSON объекта.
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data)

class HttpReadyResult(ActionResult):
    '''
    Результат выполнения операции в виде готового HttpResponse. 
    Для данного класса в self.data храниться объект класса HttpResponse.
    '''
    def get_http_response(self):
        return self.data

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
        if self.success:
            result['success'] = True
            
        else:
            result['success'] = False
            # TODO после рефактора кода необходимо строку кода ниже убрать. у нас будет просто message
            result['error_msg'] = self.message

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
            if params.has_key(key):
                arg_type = params[key][0]
                if arg_type == int:
                    value = int(value)
                elif arg_type == datetime.datetime:
                    value = datetime.datetime.strptime(value, '%d.%m.%Y')
                elif arg_type == datetime.time:
                    d = datetime.datetime.strptime(value, '%H:%M')
                    value = datetime.time(d.hour, d.minute, 0)
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
            print k,v
            if isinstance(v, int):
                result += '%s: %s,' % (k,v)
            elif isinstance(v, datetime.datetime):
                result += '%s: "%s",' % (k, v.strftime('%d.%m.%Y'))
            elif isinstance(v, datetime.time):
                result += '%s: "%s",' % (k, v.strftime('%H:%M'))
            else:
                try:
                    result += '%s: "%s",' % (k,str(v))
                except:
                    # TODO: обрабатывать все типы параметров
                    pass
        if result:
            result = result[:-1]
        print '!!!', result
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
        Возвращает полный путь до действия
        '''
        if ActionController._urltable.has_key(cls):
            url = ActionController._urltable[cls]
            ignored_chars = ['^', '&', '$']
            for char in ignored_chars:
                url = url.replace(char, '')
            return url
        return ''
    
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
        '''
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
    
class ActionController(object):
    '''
    Класс коонтроллер - обеспечивает обработку пользовательских запросов путем передачи
    их на исполнение соответствущим Action'ам
    '''
    
    #===============================================================================
    # Внутренняя таблица урлов
    #===============================================================================
    _urltable = {}
    
    def __init__(self, url = ''):
        self.packs = MutableList()
        self._patterns = MultiValueDict()
        self.url = url
        self._rebuild_lock = threading.RLock()
        # Словари для быстрого поиска паков
        self._find_by_name = {}
        self._find_by_type = {}
    
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
            self._find_by_name[clazz.__class__.__name__] = clazz
            self._find_by_type[clazz.__class__] = clazz
            
            stack.append(clazz)
            # Бежим по экшенам
            for action in clazz.actions:
                self._build_pack_node(action, stack)
            # Бежим по пакам
            for pack in clazz.subpacks:
                self._build_pack_node(pack, stack)
            stack.pop()
        else:
            clazz.controller = self
            # Полный путь всех паков
            packs_path = self.url + ''.join([x.url for x in stack])
            regex = re.compile(clazz.url, re.UNICODE)
            # Запись паттерна состоит из:
            # компилированного выражения пути, стека паков и экшена
            self._patterns.appendlist(packs_path, (regex, stack[:], clazz) )
            # добавляем полный урл до экшена
            self.__class__._urltable[clazz.__class__] = packs_path + clazz.url 
    
    def rebuild_patterns(self):
        '''
        Перестраивает внутренний список URL паттернов
        '''
        self._rebuild_lock.acquire()
        try:
            if self.packs.changed:
                self._patterns.clear()
                self._find_by_name.clear()
                self._find_by_type.clear()
                stack = []
                for pack in self.packs:
                    self._build_pack_node(pack, stack)
                self.packs.changed = False
        finally:
            self._rebuild_lock.release()
    
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
        self.rebuild_patterns()
          
        # Делим URL на часть пака и часть экшена
        path = request.path
        dot = path.rfind('/', 0, -1)
        if dot == 0:
            # URL короткий и состоит только из экшена
            pack_url = '/' 
            regex_url = path
        else:
            pack_url = path[:dot]
            regex_url = path[dot:]
        
        # Поиск подходящего под запрос экшена
        pack = self._patterns.getlist(pack_url)
        if len(pack) == 0:
            raise http.Http404()
        
        # Поиск подходящего экшена внутри пака
        for regex, stack, action in pack:
            match = regex.search(regex_url)
            if not match:
                continue
            
            # Извлечение параметров из выражения (если есть)
            #kwargs = match.groupdict()
            #if kwargs:
            #    args = ()
            #else:
            #    args = match.groups()
            
            # Непосредственный вызов экшена с отработкой всех событий
            result = self._invoke(request, action, stack)
            if isinstance(result, ActionResult):
                return result.get_http_response()
            return result
        
        raise http.Http404()
    
    def build_context(self, request):
        '''
        Выполняет построение контекста вызова операции ActionContext на основе переданного request
        '''
        return ActionContext()
    
    def find_pack(self, type):
        '''
        Ищет экшенпак внутри иерархии котроллера. Возвращает его экземпляр или None если не находит.
        type может быть классом или строкой с названием класса
        '''
        ControllerCache.populate()
        self.rebuild_patterns()
        
        if isinstance(type, str):
            return self._find_by_name.get(type)
        elif issubclass(type, ActionPack):
            return self._find_by_type.get(type)
        else:
            raise ValueError('Wrong type of argument %s' % type)
    
class ControllerCache(object):
    '''
    Внутренний класс подсистемы m3.ui.actions, который отвечает за прогрузку объявленных
    в приложениях прикладного проекта объектов ActionPack.
    В системе существует только один объект данного класса.
    '''
    _loaded = False
    _write_lock = threading.RLock()
    
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
    
#TODO: Прикрутить передачу параметров
#TODO: Что-то сделать с контекстом