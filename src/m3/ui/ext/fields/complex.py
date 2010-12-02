#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''
from django.db import models

from base import BaseExtField

from m3.ui import actions
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.ext.fields.base import BaseExtTriggerField
from m3.ui.ext.base import BaseExtComponent
from m3.ui.actions import ControllerCache
from m3.helpers.datastructures import TypedList

#===============================================================================
class ExtDictSelectField(BaseExtTriggerField):
    '''
    Поле с выбором из справочника
    
    '''
    class ExtTrigger(BaseExtComponent):
        def __init__(self, *args, **kwargs):
            self.icon_cls = None
            self.handler = None
            self.init_component(*args, **kwargs)
            
        def render(self):
            res = 'iconCls: "%s"' % (self.icon_cls if self.icon_cls else '')
            res += ',handler: %s' % self.handler if self.handler else ''
            return res
    
    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js'
        
        self.hide_trigger = True 
        self.hide_clear_trigger = False
        self.hide_edit_trigger = False
        self.hide_dict_select_trigger = False
        
        self.min_chars = 2 # количество знаков, с которых начинаются запросы на autocomplete
        
        self.set_store(ExtJsonStore())

        self.width = 150
        self.default_text = None
        
        self.ask_before_deleting = True
        
        self.url = None
        self.edit_url = None
        self.autocomplete_url = None
        
        self.value_field = 'id'     # это взято из магического метода configure_edit_field из mis.users.forms 
        self.query_param = 'filter' # и это тоже взято оттуда же
        self.display_field = 'name' # по умолчанию отображаем значение поля name
        
        # Из-за ошибки убраны свойства по умолчанию
        self.total = 'total'
        self.root = 'rows'
        
        self._triggers = TypedList(ExtDictSelectField.ExtTrigger)
        
        self.init_component(*args, **kwargs)
        
        # внутренние переменные
        self.__action_select = None
        self.__action_data = None
    
    @property
    def handler_afterselect(self):
        return self._listeners.get('afterselect')
    
    @handler_afterselect.setter
    def handler_afterselect(self, function):
        self._listeners['afterselect'] = function    
        
    @property
    def handler_beforerequest(self):
        return self._listeners.get('beforerequest')
    
    @handler_beforerequest.setter
    def handler_beforerequest(self, function):
        self._listeners['beforerequest'] = function    
        
    @property
    def handler_changed(self):
        return self._listeners.get('changed')
    
    @handler_changed.setter
    def handler_changed(self, function):
        self._listeners['changed'] = function  
    
    #===========================================================================
    # Экшены для управления процессом работы справочника  
    #===========================================================================
    
    #===========================================================================
    #  Получение окна выбора значения
    def _get_action_select(self):
        return self.__action_autocomplete
    
    def _set_action_select(self, value):
        self.__action_autocomplete = value
        if isinstance(value, actions.Action):
            self.autocomplete_url = value.absolute_url()
    action_select = property(_get_action_select, _set_action_select, doc='Действие, которое используется для получения окна выбора значения')
    #===========================================================================
    
    #==========================================================================
    # Получение списка для получения списка значений (используется в автозаполнении)
    def _get_action_data(self):
        return self.__action_data
    def _set_action_data(self):
        return self.__action_data
    action_data = property(_get_action_data, _set_action_data, doc='Действие для получения списка строковых значений для ')
    #==========================================================================
        
    
    @property
    def url(self):
        return self.__url
    
    @url.setter
    def url(self, value):
        self.__url = value
        
    @property
    def edit_url(self):
        return self.__edit_url
    
    @edit_url.setter
    def edit_url(self, value):
        self.__edit_url = value
        
    @property
    def autocomplete_url(self):
        return self.__autocomplete_url
    
    @autocomplete_url.setter
    def autocomplete_url(self, value):
        if value:
            self.editable = True
            self.get_store().url = value
        self.__autocomplete_url = value
        
    @property
    def value(self):
        return self.__value
    
    @value.setter
    def value(self, val):
        self.__value = val
        
    def configure_by_dictpack(self, pack, controller=None):
        '''
        Метод настройки поля выбора из справочника на основе 
        переданного ActionPack работы со справочниками.
        @param pack: Имя класса или класс пака.
        @controller: Контроллер в котором будет искаться пак. Если не задан, то ищем во всех.
        @deprecated: 0.4
        '''
        if controller:
            registered_pack = controller.find_pack(pack)
        else:
            registered_pack = ControllerCache.find_pack(pack)
        if not registered_pack:
            raise Exception('Pack %s not found in controller %s' % (controller, pack))
        self.url = registered_pack.get_select_url()
        self.autocomplete_url = registered_pack.rows_action.get_absolute_url()
        self.bind_pack = registered_pack # TODO: можно ли обойтись без bind_back?
    
    def set_value_from_model(self, obj):
        """
        Устанавливает значения value и default_text по экземпляру модели obj.
        Это позволяет избежать двойного присваивания в коде.
        """
        assert isinstance(obj, models.Model), '%s must be a Django model instance.' % obj
        
        self.value = getattr(obj, self.value_field)
        self.default_text = getattr(obj, self.display_field)
    
    @property
    def pack(self):
        return self.__pack
        
    @pack.setter
    def pack(self, ppack):
        '''
           Настраивает поле выбора под указанный экшенпак ppack. Причем в качестве аргумента может быть
        как сам класс пака так и если имя. Это связано с тем, что не во всех формах можно импортировать
        паки и может произойти кроссимпорт.
           Поиск пака производится по всем экшенконтроллерам в системе. Используется первый найденный, т.к.
        при правильном дизайне один и тот же пак не должен быть в нескольких контроллерах одновременно. 
        @param ppack: Имя класса пака или класс пака.
        '''
        assert isinstance(ppack, str) or hasattr(ppack, '__bases__'), 'Argument %s must be a string or class' % ppack
        ppack = ControllerCache.find_pack(ppack)
        assert ppack, 'Pack %s not found in ControllerCache' % ppack
        self.__pack = ppack
        
        # hasattr используется вместо isinstance, иначе будет перекрестный импорт.
        # Для линейного справочника и иерархического спр., если задана списочная модель, значит выбирать будут из неё.
        if hasattr(ppack, 'model') or (hasattr(ppack, 'tree_model') and ppack.list_model):
            # url формы редактирования элемента
            self.edit_url = ppack.get_edit_url()
            # url автокомплита и данных
            self.autocomplete_url = ppack.get_rows_url()
        
        # Для иерархических справочников без списочной модели
        elif hasattr(ppack, 'tree_model') and ppack.tree_model:
            self.edit_url = ppack.get_edit_node_url()
            self.autocomplete_url = ppack.get_nodes_like_rows_url()
        
        else:
            # для иных случаев (например паки без моделей) попробуем найти соответствующие методы
            if hasattr(ppack, 'get_rows_url') or hasattr(ppack, 'get_edit_url'):  
                if hasattr(ppack, 'get_rows_url'):
                    self.autocomplete_url = ppack.get_rows_url()
                if hasattr(ppack, 'get_edit_url'):
                    self.edit_url = ppack.get_edit_url()
            else:
                raise Exception('Pack %s must be a dictionary pack instance.' % ppack)
        
        # url формы выбора
        self.url = ppack.get_select_url()
        
    @property
    def total(self):
        return self.get_store().total_property
    
    @total.setter
    def total(self, value):
        self.get_store().total_property = value
        
    @property
    def root(self):
        return self.get_store().root
    
    @root.setter
    def root(self, value):
        self.get_store().root = value
        
    def add_trigger(self, *args,**kwargs):
        self._triggers.append( ExtDictSelectField.ExtTrigger(*args,**kwargs) )
        
    def t_render_triggers(self):
        return '[%s]' % ','.join(['{%s}' % item.render() for item in self._triggers])
    
    
    def render_params(self):
        action_context = None
        if self.action_context:
            # функция
            action_context = self.action_context.json
        
        self._put_params_value('askBeforeDeleting', self.ask_before_deleting)
        self._put_params_value('actions', {'actionSelectUrl': self.url,
                                           'actionEditUrl':self.edit_url,
                                           'contextJson':  action_context})
        
        self._put_params_value('defaultText', self.default_text)
        
        self._put_params_value('hideClearTrigger', self.hide_clear_trigger)
        self._put_params_value('hideEditTrigger', self.hide_edit_trigger)
        self._put_params_value('hideDictSelectTrigger', self.hide_dict_select_trigger)
        
        self._put_params_value('defaultValue', self.value)
        self._put_params_value('customTriggers', self.t_render_triggers, self._triggers )
        
    
    def render(self):
        self.render_base_config()
        self.render_params()
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        return 'createAdvancedComboBox({%s},{%s})' % (base_config, params)
       
#===============================================================================        
class ExtSearchField(BaseExtField):
    '''Поле поиска'''
    def __init__(self, *args, **kwargs):
        super(ExtSearchField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-search-field.js'
        self.query_param = None
        self.empty_text =None
        self.component_for_search = None
        self.init_component(*args, **kwargs)

#===============================================================================
class ExtFileUploadField(BaseExtField):
    r"""Компонент загрузки файлов на сервер."""
    # Префикс добавляется к скрытому полю, где передается файл 
    PREFIX = 'file_'
    
    def __init__(self, *args, **kwargs):
        super(ExtFileUploadField, self).__init__(*args, **kwargs)
        self.file_url = None
        
        # Пример использования:
        # possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp')
        self.possible_file_extensions = None
        
        self.init_component(*args, **kwargs)
        
        # Привязка к файлу
        self._memory_file = None

    def render_params(self):
        super(ExtFileUploadField, self).render_params()
        self._put_params_value('prefixUploadField', ExtFileUploadField.PREFIX)
        self._put_params_value('fileUrl', self.file_url)
#        self._put_params_value('possibleFileExtensions', 
#                               map(lambda x: x, self.possible_file_extensions or []))

    def render(self):
        self.render_base_config()
        self.render_params()
        base_config = self._get_config_str()
        params_config = self._get_params_str()
        return 'new Ext.ux.form.FileUploadField({%s}, {%s})' % (base_config, 
                                                          params_config)
    
    @property
    def memory_file(self):
        return self._memory_file
        
    @memory_file.setter
    def memory_file(self, memory_file):
        self._memory_file = memory_file
        
#===============================================================================
class ExtImageUploadField(ExtFileUploadField):
    '''
    Компонент загрузки изображений
    '''        
    THUMBNAIL_PREFIX = 'thumbnnail_' 
    def __init__(self, *args, **kwargs):
        super(ExtImageUploadField, self).__init__(*args, **kwargs)
        
        # Использовать ли миниатюры для изображений
        self.thumbnail = True
        
        # Ширина и высота миниатюры
        self.thumbnail_size = (300, 300)
        
        # Умолчательный параметр, иначе контрол разъедется
        self.width = 300
        
        # Высота и ширина изображения. Изображение будет подгоняться под 
        # эту высоту
        self.image_max_size = (1600, 1600)
        
        self.init_component(*args, **kwargs)
        
        
    def render_params(self):
        super(ExtImageUploadField, self).render_params()
        self._put_params_value('thumbnail', self.thumbnail)
        if self.thumbnail:
            assert isinstance(self.thumbnail_size , tuple) and \
                len(self.thumbnail_size) == 2
            self._put_params_value('thumbnailWidth', self.thumbnail_size[0], 
                                   self.thumbnail)
            self._put_params_value('thumbnailHeight', self.thumbnail_size[1], 
                                   self.thumbnail)
            self._put_params_value('prefixThumbnailImg', 
                                   ExtImageUploadField.THUMBNAIL_PREFIX, 
                                   self.thumbnail)
            self._put_params_value('thumbnail', self.thumbnail)
        
    def render(self):
        self.render_base_config()
        self.render_params()
        base_config = self._get_config_str()
        params_config = self._get_params_str()
        return 'new Ext.ux.form.ImageUploadField({%s}, {%s})' % (base_config, 
                                                          params_config)