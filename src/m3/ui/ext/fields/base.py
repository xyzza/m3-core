#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent

from m3.ui.ext.misc import ExtDataStore   

class BaseExtField(ExtUIComponent):
    def __init__(self, *args, **kwargs):
        super(BaseExtField, self).__init__(*args, **kwargs)
        self.label = None
        self.value = None
        self.label_style = {}
        self.read_only = False
        
        # Свойства валидации, специфичные для TextField
        self.allow_blank = True
        self.vtype= None
        self.empty_text = None
        self.min_length = self.min_length_text = None
        self.max_length = self.max_length_text = None
        self.regex      = self.regex_text      = None
        self.tab_index = None
   
    def t_render_label_style(self):
        return ';'.join(['%s:%s' % (k, v) for k, v in self.label_style.items()])
    
    #//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
    # Врапперы над событиями listeners[...]
    #------------------------------------------------------------------------
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
        res = super(BaseExtField, self).render_base_config()
        res += ',fieldLabel: "%s"' % self.label if self.label else ''
        res += ',value: "%s"' % self.value if self.value else ''
        res += ',labelStyle: "%s"' % self.t_render_label_style() \
            if self.label_style else ''
        res += ',readOnly: %s' % str(self.read_only).lower() if self.read_only else ''
        res += ',allowBlank: %s' % str(self.allow_blank).lower()
        res += ',vtype: "%s"' % self.vtype if self.vtype else ''
        res += ',minLenght: %s' % self.min_length if self.min_length else ''
        res += ',minLengthText: %s' % self.min_length_text if self.min_length_text else ''
        res += ',maxLength: %s' % self.max_length if self.max_length else ''
        res += ',maxLengthText: %s' % self.max_length_text if self.max_length_text else ''
        res += ',regex: "%s"' % self.regex if self.regex else ''
        res += ',regexText: "%s"' % self.regex_text if self.regex_text else ''
        res += ',tabIndex: "%s"' % self.tab_index if self.tab_index else ''
        return res
    
class BaseExtTriggerField(BaseExtField):
    '''Базовый класс для комбобокса, поля выбора справочника'''
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
        self.empty_text = None
        self.allow_blank = True
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
    
    def pre_render(self):
        self.__store.action_context = self.action_context
        super(BaseExtTriggerField, self).pre_render()