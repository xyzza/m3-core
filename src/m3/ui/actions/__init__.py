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
from django.contrib.auth.models import User

from m3.helpers.datastructures import MutableList
from m3.core.json import M3JSONEncoder
from m3.core.exceptions import ApplicationLogicException
from m3.helpers import ui as ui_helpers
from m3.ui.ext.base import BaseExtComponent

#===============================================================================
# Перенаправление импортов из вложенных модулей
#===============================================================================
from results import ActionResult, PreJsonResult, JsonResult, ExtGridDataQueryResult,\
                    HttpReadyResult, TextResult, ExtAdvancedTreeGridDataQueryResult,\
                    BaseContextedResult, ExtUIComponentResult, ExtUIScriptResult,\
                    OperationResult

from context import ActionContext, ActionContextDeclaration

ACD = ActionContextDeclaration

#=========================== ИСКЛЮЧЕНИЯ ========================================

class ActionException(Exception):
    def __init__(self, clazz, *args, **kwargs):
        super(Exception, self).__init__(*args, **kwargs)
        self.clazz = clazz

class ActionNotFoundException(ActionException):
    """ Возникает в случае если экшен не найден ни в одном контроллере """
    def __str__(self):
        return 'Action "%s" not registered in controller/pack' % self.clazz
    
class ActionPackNotFoundException(ActionException):
    """ Возникает в случае если экшен не найден ни в одном контроллере """
    def __str__(self):
        return 'ActionPack "%s" not registered in controller/pack' % self.clazz

class ReinitException(ActionException):
    """
    Возникает если из-за неправильной структуры паков один и тот же 
    экземпляр экшена может быть повторно инициализирован неверными значениями.
    """
    def __str__(self):
        return 'Trying to overwrite class "%s"' % self.clazz
    
class ActionUrlIsNotDefined(ActionException):
    """
    Возникает если в классе экшена не задан атрибут url.
    Это грозит тем, что контроллер не сможет найти и вызвать данный экшен при обработке запросов.
    """
    def __str__(self):
        return 'Attribute "url" is not defined or empty in action "%s"' % self.clazz
    
#===============================================================================

    
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
    
    # Наименование действия для отображения
    verbose_name = None
    
    # Признак обработки прав доступа при выполнении действия (по-умолчанию отключен)
    # Как обрабатывается этот признак - смотри в has_permission
    need_check_permission = False
    
    # Словарь внутренних прав доступа, используемых в действии
    # ключ - код права, который совмещается с кодом действия
    # значение - наименование права
    # Пример: {'tab2':u'Редактирование вкладки Доп. сведения', 'work_visible':u'Просмотр сведений о работе'}
    # Общий код права доступа будет иметь вид: /edit#tab2 и /edit#work_visible соответственно
    # Как обрабатывается этот список - смотри в has_sub_permission
    sub_permissions = {}
    
    def get_sub_permission_code(self, sub_code):
        '''
        Возвращает код суб-права
        '''
        return self.get_permission_code()+'#'+sub_code
    
    def has_sub_permission(self, user_obj, sub_code, request = None):
        '''
        Проверка на внутреннее право для указанного пользователя
        '''
        assert isinstance(self.parent, ActionPack)
        assert isinstance(sub_code, str)
        
        # Подчиненные права являются независимыми от того, если ли право на выполнение действия, 
        # т.к. эти права проверяются уже внутри действия (т.е. уже при его выполнении)
        # Но должно быть право проверять права в родительском наборе действий!
        # Если переданный код не прописан в правах этого действия, то это не наш код - значит всё разрешено 
        if self.parent.need_check_permission and sub_code in self.sub_permissions.keys():
            # если пользователя нет, значит аноним - ему дадим отпор
            if user_obj:
                # проверим что права на выполнение есть
                return user_obj.has_perm(self.get_sub_permission_code(sub_code))
            else:
                return False
        return True
    
    def get_permission_code(self):
        '''
        Возвращает код действия, для контроля прав доступа
        '''
        return self.get_absolute_url()
    
    def has_permission(self, user_obj, request = None):
        '''
        Проверка пава на выполнение действия для указанного пользователя
        '''
        assert isinstance(self.parent, ActionPack)
        # Если в наборе действий need_check_permission=True, а в самом действии False, то права не проверяются
        # Если в наборе действий need_check_permission=True, и в самом действии True, то права проверяются
        # Если в наборе действий need_check_permission=False, а в самом действии True, то права не проверяются
        # Если в наборе действий need_check_permission=False, а в самом действии False, то права не проверяются
        # Т.е. права проверяются только если в наборе действий и в действии включена проверка прав
        # Признак need_check_permission в вышестоящих наборах действий не влияет на решение, т.к. в тех наборах свои действия 
        
        # Проверим, что в действии и наборе разрешена проверка прав
        if self.need_check_permission and self.parent.need_check_permission:
            # если пользователя нет, значит аноним - ему дадим отпор
            if user_obj:
                # проверим что права на выполнение есть
                return user_obj.has_perm(self.get_permission_code())
            else:
                return False
        else:
            return True
           
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
            raise ActionNotFoundException(clazz=cls)
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
    
    # Ссылка на вышестоящий пакет, тот в котором зарегистрирован данный пакет
    parent = None
    
    # Наименование Набора действий для отображения
    verbose_name = None
    
    # Признак обработки прав доступа при выполнении дочерних действий (по-умолчанию отключен)
    # Как обрабатывается этот признак - смотри в Action.has_permission
    need_check_permission = False

    # Словарь внутренних прав доступа, используемых в наборе действий
    # ключ - код права, который совмещается с адресом (кодом) набора действий
    # значение - наименование права
    # Пример: {'edit':u'Редактирование записи'}
    # Общий код права доступа будет иметь вид: /users#edit
    # Как обрабатывается этот список - смотри в has_sub_permission
    sub_permissions = {}

    def __init__(self):
        # Список действий зарегистрированных на исполнение в данном пакете
        self.actions = []
        # Список дочерних пакетов (подпакетов) зарегистрированных на исполнение в данном пакете
        self.subpacks = []
    
    @classmethod
    def absolute_url(cls):
        '''
        Возвращает путь всех паков до текущего по иерархии
        '''
        path = [cls.url]
        pack = cls.parent
        while pack != None:
            path.append(pack.url)
            pack = pack.parent
        url = ''.join( reversed(path) )
        contr_url = ''
        for cont in ControllerCache.get_controllers():
            p = cont.find_pack(cls)
            if p:
                contr_url = cont.url
                break
        return contr_url + url
    
    def get_permission_code(self):
        '''
        Возвращает код, для контроля прав доступа
        '''
        return self.absolute_url()
    
    def get_sub_permission_code(self, sub_code):
        '''
        Возвращает код суб-права
        '''
        return self.get_permission_code()+'#'+sub_code
    
    def has_sub_permission(self, user_obj, sub_code, request = None):
        '''
        Проверка на внутреннее право для указанного пользователя
        '''
        assert isinstance(sub_code, str)
        
        # Подчиненные права набора действий проверяются только в случае разрешения проверки в наборе действий
        # Если переданный код не прописан в правах этого действия, то это не наш код - значит всё разрешено 
        if self.need_check_permission and sub_code in self.sub_permissions.keys():
            # если пользователя нет, значит аноним - ему дадим отпор
            if user_obj:
                # проверим что права на выполнение есть
                return user_obj.has_perm(self.get_sub_permission_code(sub_code))
            else:
                return False
        return True
    
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
    
    # Наименование Контроллера для отображения
    verbose_name = None
    
    class FakePacks:
        pass
    
    def __init__(self, url = '', name=None):
        '''
        url - используется для отсечения лишней части пути в запросе, поскольку
              управление в пак передается из вьюшки
        name - человеческое название контроллера. Используется для отладки.
        '''
        # ДЛЯ СОВМЕСТИМОСТИ.
        # Имитирует список паков торчащий наружу
        self.packs = self.FakePacks()
        self.packs.append = self.append_pack
        self.packs.extend = self.extend_packs
        
        # Используется для отсечения лишней части пути в запросе
        self.url = url
        self.name = name
        
        # Словарь для быстрого разрешения запросов. Состоит из полного пути запроса, списка 
        # вызываемых паков и экшена. Пример: {'/dict/lpu/get_rows': ([DictPack, LPUPack], RowsAction)}
        self._url_patterns = {}
        
        # Словари для быстрого поиска паков по имени и классу, например: {'DictPack', <DictPack instance at 0x01FBACB0>}
        self._packs_by_name = {}
        self._packs_by_type = {}
        self._actions_by_type = {}
        
        self.top_level_packs = []
        
        # Блокировка для перестроения паттернов урлов
        self._rebuild_lock = threading.RLock()
        
        # Признак того, что контроллер зарегистрирован во внутреннем кеше
        self._registered = False
        
    def __str__(self):
        return self.name if self.name else super(ActionController, self).__str__()
        
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
        
        # Отладочный атрибут built нужен чтобы обнаружить повторное перестроение экшенов
        if hasattr(clazz, '_built'):
            raise ReinitException(clazz=clazz)
        clazz._built = True
        
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
        # проверим что права на выполнение есть
        if not action.has_permission(request.user, request):
            return OperationResult(success = False, message = u'У вас нет прав на выполнение этого действия!')
        
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
        
        try:
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
        except ApplicationLogicException as exc:
            return OperationResult(success = False, message = exc.exception_message)
            
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
        
        # нам обязательно нужен экземпляр класса
        # этот метод повторяется кучу раз
        if isinstance(pack, str):
            cleaned_pack = self._load_class(pack)()
        elif inspect.isclass(pack):
            cleaned_pack = pack()
        else:
            cleaned_pack = pack
        
        if cleaned_pack not in self.top_level_packs:
            self.top_level_packs.append(cleaned_pack) 
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
        if not final_action.url:
            raise ActionUrlIsNotDefined(final_action)
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
                
            # Создание нового урла
            full_path = self._build_full_path(packs_list, final_action)
            new_patterns[full_path] = (packs_list[:], final_action)
            current_packs_slice = packs_list[:pos + 1]
            
        self._url_patterns = new_patterns
        
        # У враппера могут быть собственные экшены и паки. Их тоже нужно построить.
        # Но врапперы также могут быть наследованы от оригинальных паков, поэтому не нужно перестраивать
        # уже существующие экшены и паки, только заменить у них родителя
        if current_packs_slice:
            for subpack in wrapper.subpacks:
                if subpack not in pack.subpack:
                    self._build_pack_node(subpack, current_packs_slice)

            for action in wrapper.actions:
                if action not in pack.actions:
                    self._build_pack_node(action, current_packs_slice)
                    
        else:
            raise ActionPackNotFoundException(dest_pack)
        
    
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
            raise ActionPackNotFoundException(dest_pack)
            
    
    def dump_urls(self):
        '''
        Отладочный метод. Выводит список всех адрес зарегистрированных в контроллере.
        '''
        print '==== CONTROLLER WITH URL: %s ======' % self.url
        for key in sorted(self._url_patterns.keys()):
            print key
        print
        print 'Total patterns %s' % len(self._url_patterns.keys())
    
    def get_action_by_url(self, url):
        '''
        Получить Action по url
        '''
        ControllerCache.populate()

        matched = self._url_patterns.get(url)
        if matched:
            stack, action = matched
            return action
        else:
            return None
    
    def get_top_actions(self):
        '''
        Получение списка действий или наборов, находящихся на первом уровне 
        '''
        top_packs = []
        for stack, act in self._url_patterns.values():
            if len(stack) == 0:
                # значит экшин на верхнем уровне
                if act not in top_packs:
                    top_packs.append(act)
            else:
                if stack[0] not in top_packs:
                    top_packs.append(stack[0])
        return top_packs

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
        cls.populate()
        for cont in cls._controllers:
            url = cont.get_action_url(type)
            if url:
                return url
    
    @classmethod
    def find_pack(cls, pack):
        """
        Ищет заданный pack по имени или классу во всех зарегистрированных контроллерах.
        Возвращает экземпляр первого найденного пака.
        @param pack: Имя или класс пака.
        """
        for cont in list(cls._controllers):
            p = cont.find_pack(pack)
            if p:
                return p
    
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

    @classmethod
    def require_update(cls):
        cls._loaded = False
        
    @classmethod
    def get_action_by_url(cls, url):
        '''
        Возвращает Action по переданному url 
        '''
        for cont in cls._controllers:
            act = cont.get_action_by_url(url)
            if act:
                return act
        return None
    
    @classmethod
    def get_controllers(cls):
        return cls._controllers