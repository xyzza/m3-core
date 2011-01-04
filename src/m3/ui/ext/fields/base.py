#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent

from m3.ui.ext.misc import ExtDataStore   

class BaseExtField(ExtUIComponent):
    '''
    Базовый класс для полей
    
    @version: 0.1
    @begin_designer
    {abstract: true
    ,attr: [{
        ext_attr: "fieldLabel"
        ,py_attr: "label" 
    },{
        ext_attr: "value"
        ,py_attr: "value" 
    },{
        ext_attr: "labelStyle"
        ,py_attr: "label_style" 
    },{
        ext_attr: "readOnly"
        ,py_attr: "read_only" 
    },{
        ext_attr: "allowBlank"
        ,py_attr: "allow_blank" 
    },{
        ext_attr: "hideLabel"
        ,py_attr: "hide_label"
    },{
        ext_attr: "vtype"
        ,py_attr: "vtype" 
    },{
        ext_attr: "emptyText"
        ,py_attr: "empty_text" 
    },{
        ext_attr: "minLength"
        ,py_attr: "min_length" 
    },{
        ext_attr: "minLengthText"
        ,py_attr: "min_length_text" 
    },{
        ext_attr: "maxLength"
        ,py_attr: "max_length" 
    },{
        ext_attr: "maxLengthText"
        ,py_attr: "max_length_text" 
    },{
        ext_attr: "regex"
        ,py_attr: "regex" 
    },{
        ext_attr: "regexText"
        ,py_attr: "regex_text" 
    },{
        ext_attr: "tabIndex"
        ,py_attr: "tab_index" 
    },{
        ext_attr: "invalidClass"
        ,py_attr: "invalid_class"
        ,default: "m3-form-invalid"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtField, self).__init__(*args, **kwargs)
        self.label = None
        
        # Нужно выставлять пустое значение для того, чтобы обязательные поля, 
        # те, которые allow_blank=False подсвечивались автоматически после 
        # рендеринга 
        self.value = ""
        
        self.label_style = {}
        self.hide_label = False
        self.read_only = False
        
        self.is_edit = True
        
        # Свойства валидации, специфичные для TextField
        self.allow_blank = True
        self.vtype= None
        self.empty_text = None
        self.min_length = self.min_length_text = None
        self.max_length = self.max_length_text = None
        self.regex      = self.regex_text      = None
        self.tab_index = None
        self.invalid_class = 'm3-form-invalid'
   
    def t_render_label_style(self):
        return ';'.join(['%s:%s' % (k, v) for k, v in self.label_style.items()])

    def t_render_regex(self):
        return '/%s/' % self.regex
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.read_only = access_off

    #===========================================================================
    # Врапперы над событиями listeners[...]
    #===========================================================================
    @property
    def handler_specialkey(self):
        return self._listeners.get('specialkey')
    
    @handler_specialkey.setter
    def handler_specialkey(self, function):
        self._listeners['specialkey'] = function
    
    @property
    def handler_change(self):
        return self._listeners.get('change')
    
    @handler_change.setter
    def handler_change(self, function):
        self._listeners['change'] = function
    
    def render_base_config(self):
        if self.read_only:
            grey_cls = 'm3-grey-field'
            self.cls = grey_cls  if not self.cls else self.cls + grey_cls
        
        super(BaseExtField, self).render_base_config()
        self._put_config_value('fieldLabel', self.label)
        self._put_config_value('value', self.value)
        
        if  self.label_style:
            self._put_config_value('labelStyle', self.t_render_label_style() )
        self._put_config_value('readOnly', self.read_only, self.read_only)
        self._put_config_value('isEdit', self.is_edit)
        self._put_config_value('allowBlank', self.allow_blank, not self.allow_blank)
        self._put_config_value('vtype', self.vtype)
        self._put_config_value('emptyText', self.empty_text)
        self._put_config_value('minLength', self.min_length)
        self._put_config_value('minLengthText', self.min_length_text)
        self._put_config_value('maxLength', self.max_length)
        self._put_config_value('maxLengthText', self.max_length_text)
        self._put_config_value('regex', self.t_render_regex, self.regex)
        self._put_config_value('regexText', self.regex_text)
        self._put_config_value('tabIndex', self.tab_index)
        self._put_config_value('invalidClass', self.invalid_class)
        self._put_config_value('hideLabel', self.hide_label)
        

    
class BaseExtTriggerField(BaseExtField):
    '''
    Базовый класс для комбобокса, поля выбора справочника
    
    @version: 0.1
    @begin_designer
    {abstract: true
    ,attr: [{
        ext_attr: "displayField"
        ,py_attr: "display_field" 
    },{
        ext_attr: "valueField"
        ,py_attr: "value_field"
    },{
        ext_attr: "hiddenName"
        ,py_attr: "hidden_name"
    },{
        ext_attr: "hideTrigger"
        ,py_attr: "hide_trigger"
    },{
        ext_attr: "typeAhead"
        ,py_attr: "type_ahead"
    },{
        ext_attr: "queryParam"
        ,py_attr: "query_param"
    },{
        ext_attr: "pageSize"
        ,py_attr: "page_size"
    },{
        ext_attr: "maxHeight"
        ,py_attr: "max_heigth_dropdown_list"
    },{
        ext_attr: "minChars"
        ,py_attr: "min_chars"
    },{
        ext_attr: "store"
        ,py_attr: "store"
    },{
        ext_attr: "mode"
        ,py_attr: "mode"
    },{
        ext_attr: "editable"
        ,py_attr: "editable"
    },{
        ext_attr: "triggerAction"
        ,py_attr: "trigger_action"
    },{
        ext_attr: "forceSelection"
        ,py_attr: "force_selection"
    },{
        ext_attr: "valueNotFoundText"
        ,py_attr: "not_found_text"
    }]}
    @end_designer
    FIXME: Необходимо создать свойство trigger_action_all
           Внутри него изменять атрибут trigger_action     
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtTriggerField, self).__init__(*args, **kwargs)
        self.display_field = None
        self.value_field = None
        self.hidden_name = None
        self.hide_trigger = False
        self.type_ahead = False
        self.query_param = None
        self.page_size = None
        self.max_heigth_dropdown_list = None
        self.min_chars = None
        self.__store = None
        #self.empty_text = None # Определен в родительском классе
        #self.allow_blank = True # Определен в родительском классе
        self.mode = None
        self.editable = True
        self.trigger_action_all = False
        self.force_selection = False
        self.not_found_text = None
    
    def set_store(self, store):
        self.mode = 'local' if isinstance(store, ExtDataStore) else 'remote' 
        self.__store = store
        
    def get_store(self):
        return self.__store
        
    def t_render_store(self):
        assert self.__store, 'Store is not define'
        return self.__store.render([self.display_field,])       
    
    @property
    def name(self):
        return self.hidden_name
    
    @name.setter
    def name(self, value):
        self.hidden_name = value
    
    #//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
    # Врапперы над событиями listeners[...]
    #------------------------------------------------------------------------
    @property
    def handler_change(self):
        return self._listeners.get('change')
    
    @handler_change.setter
    def handler_change(self, function):
        self._listeners['change'] = function
        
    @property
    def handler_select(self):
        return self._listeners.get('select')
    
    @handler_select.setter
    def handler_select(self, function):
        self._listeners['select'] = function
        
    @property
    def handler_afterrender(self):
        return self._listeners.get('afterrender')
    
    @handler_afterrender.setter
    def handler_afterrender(self, function):
        self._listeners['afterrender'] = function
    
    def pre_render(self):
        if self.get_store():
            self.get_store().action_context = self.action_context
        super(BaseExtTriggerField, self).pre_render()
        
    def render_base_config(self):
        self.pre_render()
        
        super(BaseExtTriggerField, self).render_base_config()
        self._put_config_value('displayField', self.display_field)
        self._put_config_value('valueField', self.value_field)
        self._put_config_value('hiddenName', self.hidden_name)
        self._put_config_value('hideTrigger', self.hide_trigger)
        self._put_config_value('typeAhead', self.type_ahead)
        self._put_config_value('queryParam', self.query_param)
        self._put_config_value('pageSize', self.page_size)
        self._put_config_value('maxHeight', self.max_heigth_dropdown_list)
        self._put_config_value('minChars', self.min_chars)
        
        self._put_config_value('mode', self.mode)
        if self.trigger_action_all:
            self._put_config_value('triggerAction', 'all')
            
        self._put_config_value('editable', self.editable)            
        self._put_config_value('forceSelection', self.force_selection)
        self._put_config_value('valueNotFoundText', self.not_found_text)
        self._put_config_value('loadingText', u'Загрузка...')
        self._put_config_value('store', self.t_render_store, self.get_store())
    
