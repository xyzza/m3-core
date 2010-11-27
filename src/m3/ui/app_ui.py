#coding:utf-8
'''
Классы для работы первично отображаемого интерфейса MIS.
Включают список модулей в меню "Пуск" и список модулей на "Рабочем столе"

Created on Nov 18, 2010

@author: prefer
'''
import threading
import copy
from uuid import uuid4

from django.conf import settings
from django.utils.importlib import import_module
from django.contrib.auth.models import User

from m3.helpers.datastructures import TypedList
from m3.helpers import logger
from m3.contrib.m3_users import GENERIC_USER, SUPER_ADMIN

from m3.contrib.m3_users.helpers import get_assigned_metaroles_query
from m3.contrib.m3_users.metaroles import UserMetarole
from m3.ui.actions.packs import BaseDictionaryActions
from m3.ui.actions import ControllerCache, Action
from m3.ui.actions.tree_packs import BaseTreeDictionaryActions

#from mis.users.metaroles import UserMetaRole, get_metarole

# Константы: "Разделитель", "Блок с текущим временем", "Заполняющий блок"
SEPARATOR = '-'
TIMEBLOCK = 'TIMEBLOCK'
FILLBLOCK = 'FILLBLOCK'

class DesktopException(Exception):
    """
    Возникает при ошибках сборки рабочего стола, ярлыков, пунктов меню и т.п.
    """
    pass

class DesktopModel(object):
    '''
        Класс, агрегирующий в себе список модулей (start_menu и toolbox) в меню пуск 
        и список модулей на Рабочем Столе (desktop)
    '''
    
    def __init__(self):
        '''
        @param start_menu: список основных модулей для меню Пуск
        @param toolbox: список настроечных модулей для меню Пуск
        @param desktop: список модулей на Рабочем столе
        @param toptoolbar: список модулей на верхней панели
        '''
        self.start_menu = TypedList(BaseDesktopElement)
        self.toolbox    = TypedList(BaseDesktopElement)
        self.desktop    = TypedList(DesktopLauncher)
        self.toptoolbar = TypedList(BaseDesktopElement)


class BaseDesktopElement(object):
    '''
        Базовый класс для объекта модулей и объекта подменю
    '''
    def __init__(self, *args, **kwargs):
        '''
            @param name: Название модуля или подменю
            @param icon: Класс CSS, отвечающий за отрисовку иконки
        '''
        self.name = ''
        self.icon = ''
        self.index = 0
        self.id = str(uuid4())[0:8]

    def _init_component(self, *args, **kwargs):
        '''Заполняет атрибуты экземпляра значениями из kwargs'''
        for k, v in kwargs.items():
            assert self.__dict__.has_key(k), 'Instance attribute "%s" should be defined in class "%s"!' % (k, self.__class__.__name__)
            self.__setattr__(k, v)
            
    def render(self):
        ''' Должен быть переопределен в классе-наследнике'''
        raise NotImplementedError()
    
    def __cmp__(self, obj):
        res = self.id == obj.id if isinstance(obj, BaseDesktopElement) else False
        return not res



class DesktopLaunchGroup(BaseDesktopElement):
    '''Класс для работы подменю по нажатию на кнопку Пуск'''
    def __init__(self, *args, **kwargs):
        '''
        subitem: Хранит список модулей и список подменю
        '''
        super(DesktopLaunchGroup, self).__init__(*args, **kwargs)
        self.subitems = TypedList(BaseDesktopElement)
        self.index = 10
        self.icon = 'default-launch-group'
        self._init_component(*args, **kwargs)
        
    def t_is_subitems(self):
        ''' Для удобства понимания что рендерить. Используется в шаблонах.'''
        return True
    
    def render(self):
        ''' Рендерит имеющийся объект. Вызывается из функции render. '''
        if self.subitems:
            res = 'text: "%s"' % self.name.replace('"', "&quot;")
            res += ',iconCls:"%s"' % self.icon
            res += ',handler: function(){return false;}'
            res += ',menu:%s' % self.render_items()
            return '{%s}' % res 
        else:
            return None
        
    def __deepcopy__(self, memo):
        clone = DesktopLaunchGroup()
        clone.name = self.name
        clone.icon = self.icon
        clone.index = self.index
        clone.id = self.id
        for subitem in self.subitems:
            clone.subitems.append( copy.deepcopy(subitem) )
        return clone
     
    def render_items(self):   
        ''' Рендерит имеющийся список объектов. Вызывается из шаблона.'''
        res = []
        for item in self.subitems:
                rendered = item.render()
                if rendered:
                    res.append(rendered)
        return '{items: [%s]}' % ','.join(res) 
    
    
class DesktopLauncher(BaseDesktopElement):
    '''    
        Класс для работы модулей. Модули могут находится в меню Пуск, на рабочем столе. 
        Данные модули могут включать в себя класс DesktopLaunchGroup в атрибут subitems
    '''
    def __init__(self, *args, **kwargs):
        '''
        @param url: url-адрес, запрос по которому возвратит форму
        '''
        super(DesktopLauncher, self).__init__(*args, **kwargs)
        self.url = ''
        self.icon = 'default-launcher'
        self.index = 100
        self._init_component(*args, **kwargs)
        
    def t_is_subitems(self):
        ''' Для удобства понимания что рендерить. Используется в шаблонах.'''
        return False
        
    def render(self):
        '''Рендерит текущий объект. Вызывается из метода render_items класса DesktopLaunchGroup'''
        res = 'text:"%s"' % self.name.replace('"', "&quot;")
        res += ',iconCls:"%s"' % self.icon
        res += ',handler: function(){return sendRequest("%s", AppDesktop.getDesktop());}' % self.url
        return '{%s}' % res


class DesktopShortcut(DesktopLauncher):
    """
    Отличается от DesktopLauncher тем, что автоматически подцепляет адрес из пака, в зависимости от его типа.
    """
    def __init__(self, pack, *args, **kwargs):
        """
        Конструктор
        @param pack: Имя или класс пака
        """
        super(DesktopShortcut, self).__init__(*args, **kwargs)
        # Если это экшен, то получаем его адрес
        if hasattr(pack, '__dict__') and issubclass(pack, Action):
            self.url = pack.absolute_url()
        elif isinstance(pack, Action):
            self.url = pack.get_absolute_url()
        else:
            # Пробуем найти как пак
            p = ControllerCache.find_pack(pack)
            if not p:
                raise DesktopException('Pack %s not found in ControllerCache' % pack)
            # Если это справочник
            if isinstance(p, (BaseDictionaryActions, BaseTreeDictionaryActions)):
                self.url = p.get_list_url()
                # Если не задано имя ярлыка, то название берем из справочника
                if not kwargs.get('name'):
                    self.name = p.title
            else:
                raise DesktopException('I do not know how to handle this type of ActionPack: %s' % pack)


class DesktopLoader(object):
    '''
    Загрузчик значков и меню для веб-десктопа
    '''
    _lock = threading.RLock()
    _cache = None
    # Флаг того, что кэш загружен. Из-за ошибок при сборке он может недозаполниться, а поскольку
    # это операция разовая, больше ошибки не будет. Флаг будет повторять ошибку для облегчения
    # ее обнаружения.
    _success = False 
    
    #Константы определяющие куда добавить элемент
    DESKTOP = 0
    START_MENU = 1
    TOOLBOX = 2
    TOPTOOLBAR = 3
    
    @classmethod
    def _load_desktop_from_apps(cls):
        cls._lock.acquire()
        try:
            if not cls._success:
                cls._cache = {}
                # Из инитов всех приложения пытаемся выполнить register_desktop_menu
                for app_name in settings.INSTALLED_APPS:
                    try:
                        module = import_module('.app_meta', app_name)
                    except ImportError, err:
                        if err.args[0].find('No module named') == -1 or err.args[0].find('app_meta') == -1:
                            logger.exception(u'При сборке интерфейса не удалось подключить %s' % app_name)
                            raise
                        continue
                    proc = getattr(module, 'register_desktop_menu', None)
                    if callable(proc):
                        proc()
            cls._success = True
        finally:
            cls._lock.release()
        
    @classmethod
    def populate(cls, user, desktop):
        '''
        Метод, который выполняет всю работу по настройке десктопа во вьюшке
        '''
        def join_list(existing_list, in_list):
            '''
            Складывает два списка с объектами DesktopLaunchGroup и DesktopLauncher 
            произвольного уровня вложенности
            '''
            for in_el in in_list:
                if isinstance(in_el, DesktopLaunchGroup) and in_el in existing_list:
                    for ex_el in existing_list:
                        if ex_el == in_el:
                            join_list(ex_el.subitems, in_el.subitems)
                            break
  
                elif in_el in existing_list:
                    continue
                else:
                    existing_list.append(in_el)
        
        def add_el_to_desktop(cls, desktop, metarole_code):
            '''
            Добавляет элементы к интерфейсу в зависимости от метароли
            '''
            items_for_role = cls._cache.get(metarole_code, {})
            for place, items in items_for_role.items():
                if place == cls.DESKTOP:
                    join_list(desktop.desktop, items)
                elif place == cls.START_MENU:
                    join_list(desktop.start_menu, items)
                elif place == cls.TOOLBOX:
                    join_list(desktop.toolbox, items)
                elif place == cls.TOPTOOLBAR:
                    join_list(desktop.toptoolbar, items)
                    
        def sort_desktop(desktop_list):
            '''
            Сортирует все контейнеры десктопа в зависимости от индекса (index)
            '''
            desktop_list.sort(key = lambda item: item.index)
            for item in desktop_list:
                if isinstance(item, DesktopLaunchGroup):
                    sort_desktop(item.subitems)
                
                    
        assert isinstance(desktop, DesktopModel)
        assert isinstance(user, User)

        # Загрузка кеша
        if not cls._success:
            cls._load_desktop_from_apps()

        assign_roles = get_assigned_metaroles_query(user)
        if not assign_roles:
            if user.is_superuser:
                add_el_to_desktop(cls, desktop, SUPER_ADMIN)
            else:
                add_el_to_desktop(cls, desktop, GENERIC_USER)
        else:
            for role in assign_roles:
                add_el_to_desktop(cls, desktop, role)

        sort_desktop(desktop.desktop)
        sort_desktop(desktop.start_menu)
        sort_desktop(desktop.toolbox)
        sort_desktop(desktop.toptoolbar)
            
    
    @classmethod
    def add(cls, metarole, place, element):
        '''
        Добавление элемента дектопа в кэш заданной метароли
        '''
        def find_by_name(existed_list, name):
            '''
            Поиск внутри списка группы с заданным именем name
            '''
            for item in existed_list:
                if isinstance(item, DesktopLaunchGroup):
                    assert isinstance(item.name, unicode), 'The attribute "name" must be written in Unicode'
                    if item.name == name:
                        return item

        def insert_item(existed_list, item):
            # Если добавляемый элемент группа, то нужно проверить есть ли у нас уже такая группа
            # Если нет - добавляем, иначе нужно зайти в нее и продолжить проверку вниз по дереву
            if isinstance(item, DesktopLaunchGroup):
                collision_item = find_by_name(existed_list, item.name)
                if collision_item == None:
                    # Раз нет переcений по имени, то можно добавлять
                    existed_list.append(item)
                else:
                    for it in item.subitems:
                        insert_item(collision_item.subitems, it)
            else:
                existed_list.append(item)
        
        def insert_for_role(metarole, el, processed_metaroles=[]):
            if metarole in processed_metaroles:
                return
            processed_metaroles.append(metarole)
            element = copy.deepcopy(el)
            
            # Кэш состоит из 3х уровней: словарь с метаролями, словарь с местами и список конечных элементов
            items_for_role = cls._cache.get(metarole.code, {})
            items_for_place = items_for_role.get(place, [])
            insert_item(items_for_place, element)
            items_for_role[place] = items_for_place 
            cls._cache[metarole.code] = items_for_role
            
            # Не достаточно добавить элементы только в одну метароль, т.к. она может входить внутрь
            # другой метароли. Так что нужно пробежаться по ролям которые включают в себя нашу роль.
            for role in metarole.get_owner_metaroles():
                insert_for_role(role, element, processed_metaroles)
        
        #===============================================
        assert place >= 0 and place <=3
        assert isinstance(metarole, UserMetarole)

        insert_for_role(metarole, element)
