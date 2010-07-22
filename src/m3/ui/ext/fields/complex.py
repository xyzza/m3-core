#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from m3.ui import actions
from base import BaseExtField
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.ext.fields.base import BaseExtTriggerField
from m3.ui.ext.base import BaseExtComponent
from m3.helpers.datastructures import TypedList

class ExtDictSelectField(BaseExtTriggerField):
    '''
    Поле с выбором из справочника
    
    Пример конфигурирования поля
    
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
        
    def configure_by_dictpack(self, pack, controller):
        '''
        Метод настройки поля выбора из справочника на основе 
        переданного ActionPack работы со справочниками
        '''   
        registered_pack = controller.find_pack(pack)
        if not registered_pack:
            raise Exception('Pack %s not found in controller %s' % (controller, pack))
        self.url = registered_pack.get_select_url()
        self.autocomplete_url = registered_pack.rows_action.get_absolute_url()
        self.bind_pack = registered_pack # TODO: можно ли обойтись без bind_back?
    
    
    @property
    def pack(self):
        return self.__pack
        
    @pack.setter
    def pack(self, ppack):
        self.__pack = ppack
        
        # hasattr используется вместо isinstance, иначе будет перекрестный импорт. В оригинале:
        # if isinstance(ppack, BaseDictionaryActions) or (isinstance(ppack, BaseTreeDictionaryActions) and ppack.list_model):
        # Для линейного справочника и иерархического спр., если задана списочная модель, значит выбирать будут из неё.
        if hasattr(ppack, 'model') or (hasattr(ppack, 'tree_model') and ppack.list_model):
            # url формы редактирования элемента
            self.edit_url = ppack.get_edit_url()
            # url автокомплита и данных
            self.autocomplete_url = ppack.get_rows_url()
        
        # Для иерархических справочников без списочной модели
        elif hasattr(ppack, 'tree_model') and ppack.tree_model:
            self.edit_url = ppack.get_edit_node_url()
            self.autocomplete_url = ppack.get_nodes_url()
            
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
        return ','.join(['{%s}' % item.render() for item in self._triggers])
    
    
    def render_params(self):
        res = 'askBeforeDeleting: %s' % str(self.ask_before_deleting).lower()
        res += ',actions:{actionSelectUrl:"%(select_url)s" \
                          ,actionEditUrl:"%(edit_url)s" \
                          ,contextJson:%(context_json)s \
        }' % {'select_url': self.url if self.url else '' ,
              'edit_url': self.edit_url if self.edit_url else '' ,
              'context_json': self.action_context.json() if self.action_context else '' ,}    
        
        #res += ',hideTrigger: %s' % str(self.hide_trigger).lower()  
        res += ',defaultText: "%s"' % self.default_text if self.default_text else ''
        res += ',defaultValue: "%s"' % self.value if self.value else ''
        res += ',customTriggers: [%s]' % self.t_render_triggers() \
                if self._triggers else ''
        return res
        
class ExtSearchField(BaseExtField):
    '''Поле поиска'''
    def __init__(self, *args, **kwargs):
        super(ExtSearchField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-search-field.js'
        self.query_param = None
        self.empty_text =None
        self.component_for_search = None
        self.init_component(*args, **kwargs)
    