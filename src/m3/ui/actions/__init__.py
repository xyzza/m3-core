#coding:utf-8
import threading
from django.conf import settings
from django.utils.importlib import import_module
import re
from inspect import isclass
from django.utils.datastructures import MultiValueDict
from django import http
from m3.helpers.datastructures import MutableList
from m3.core.json import M3JSONEncoder
import json

class ActionResult(object):
    '''
    Класс описывает результат выполнения Action'а
    '''
    
    def __init__(self, data = None):
        self.data = data
        
    def get_http_response(self):
        '''
        Переопределяемый в дочерних классах метод.
        '''
        raise NotImplementedError()
    
class PreJsonResult(ActionResult):
    '''
    Результат выполнения операции в виде, например, списка объектов, 
    готовых к сериализации в JSON формат и отправке в response.
    Для данного класса в self.data храниться список некоторых объектов. 
    Метод self.get_http_response выполняет сериализацию этих данных в строковый формат.
    '''
    def get_http_response(self):
        encoder = M3JSONEncoder()
        result = encoder.encode(self.data)
        return http.HttpResponse(result)

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

class ExtUIComponentResult(ActionResult):
    '''
    Результат выполнения операции, описанный в виде отдельного компонента пользовательского интерфейса.
    В self.data хранится некоторый наследник класса m3.ui.ext.ExtUiComponent.
    Метод get_http_response выполняет метод render у объекта в self.data.
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data.render())

class ExtUIScriptResult(ActionResult):
    '''
    По аналогии с ExtUiComponentResult, представляет собой некоторого наследника класса ExtUiComponent.
    Единственное отличие заключается в том, что get_http_response должен сформировать
    готовый к отправке javascript. Т.е. должен быть вызван метод self.data.get_script()
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data.get_script())
    
class OperationResult(ActionResult):
    '''
    Результат выполнения операции, описанный в виде Ajax результата ExtJS: success или failure.
    '''
    def __init__(self, success = True, *args, **kwargs):
        super(OperationResult, self).__init__(*args, **kwargs)
        self.success = success
        self.error_message = ''
    
    @staticmethod
    def by_message(message):
        '''
        Возвращает экземпляр OperationResult построенный исходя из сообщения message.
        Если операция завершилась успешно, то сообщение должно быть пустым.
        '''
        result = OperationResult(success = True)
        if message:
            result.success = False
            result.error_message = message
        return result
    
    def get_http_response(self):
        result = {}
        if self.success:
            result['success'] = True
        else:
            result['success'] = False
            result['errors'] = {'reason': self.error_message}

        result = json.JSONEncoder().encode(result)
        return http.HttpResponse(result)

class ActionContextDeclaration(object):
    '''
    Класс, который декларирует необходимость наличия определенного параметра в объекте контекста
    '''
    name = ''
    default = None
    required = False
    type = None

class ActionContext(object):
    '''
    Контекст выполнения операции, восстанавливаемый из запроса.
    '''
    
    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов согласно переданному request
        '''
        pass
    
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
        elif isclass(clazz):
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
            # Для отладки
            if __debug__:
                print packs_path, clazz.url
    
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
                except ImportError:
                    continue
                proc = getattr(module, 'register_ui_actions', None)
                if callable(proc):
                    proc()
            cls._loaded = True
        finally:
            cls._write_lock.release()
        return True
    
#TODO: Прикрутить передачу параметров
#TODO: Что-то сделать с контекстом