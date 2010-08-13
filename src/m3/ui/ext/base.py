#coding:utf-8
'''
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3.ui.ext

Created on 01.03.2010

@author: akvarats
@author: prefer
'''

from uuid import uuid4
import datetime

from django import template as django_template
from django.conf import settings

from m3.ui.ext import render_template, render_component
from m3.helpers import js

#===============================================================================
class ExtUIScriptRenderer(object):
    '''
    Класс, отвечающий за рендер файла скрипта, который
    будет отправлен клиенту. 
    '''
    def __init__(self):
        # шаблон, в который осуществляется вывод содержимого
        # скрипта
        self.template = 'ext-script/ext-ui-script.js'
        # компонент, содержимое которого выводится в шаблон
        self.component = None
    
    def render(self):
        result = ''
        try:
            result = self.component.render()
        except AttributeError:
            result = ''
        return result
    
    def render_globals(self):
        result = ''
        try:
            result = self.component.render_globals()
        except AttributeError:
            result = ''
        return result 
        
    def get_script(self):
        '''
        Генерация скрипта для отправки на клиентское рабочее место.
        '''
        context = django_template.Context({'renderer': self})
        template = django_template.loader.get_template(self.template)
        script = template.render(context)
        if settings.DEBUG:
            script = js.JSNormalizer().normalize(script)
        return script

#===============================================================================
class BaseExtComponent(object):
    '''
    Базовый класс для всех компонентов пользовательского интерфейса
    '''
    def __init__(self, *args, **kwargs):
        self.template = ''
        self.template_globals = ''
        self.client_id = 'cmp_' + str(uuid4())[0:8]
        
        # action context of the component (normally, this is
        # an instance of m3.ui.actions.ActionContext class
        self.action_context = None 
        
        # рендерер, используемый для вывода соответствующего компонента
        self.renderer = ExtUIScriptRenderer()
        
        # Обработчики
        self._listeners = {}
    
        # Список словарей с конфигурацией компонента
        self._config_list = []
        self._param_list = []
        
        # Если True, то рендерится как функция, без префикса new
        self._is_function_render = False
        self._ext_name = None
    
    def render(self):
        '''
        Возвращает "кусок" javascript кода, который используется для
        отображения самого компонента. За рендер полного javascript
        отвечает метод get_script()
        '''
        self.pre_render()
        return render_component(self)
    # Код ниже раскомментировать как только все компоненты будут поддерживать 
    # новый рендеринг
#        assert getattr(self, '_ext_name'), 'Class %s is not define "_ext_name"' % \
#            (self.__class__.__name__,)
#        
#        self.pre_render()
#        
#        try:
#            self.render_base_config()
#            self.render_params()
#        except UnicodeDecodeError:
#            raise Exception('Some attribute is not unicode')
#        except Exception as msg:
#            raise Exception(msg) 
#        
#        base_config = self._get_config_str()
#        params = self._get_params_str()
#        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
#                            % {'ext_name': self._ext_name,
#                            'base_config': base_config,
#                            'params': params }
                            
#        return 'new %s' % res if not self._is_function_render else res
    
    def render_globals(self):
        '''
            Рендерит и возвращает js-код, который помещен в template_globals
        '''
        self.pre_render_globals()
        if self.template_globals:
            return render_template(self.template_globals, {'component': self, 
                                                           'self' : self})
        return ''
    
    def pre_render(self):
        '''
        Вызывается перед началом работы метода render
        '''
        pass
    
    def pre_render_globals(self):
        '''
        Вызывается перед началом работы метода render_globals
        '''
        pass
    
    def get_script(self):
        return self.renderer.get_script()
    
    def init_component(self, *args, **kwargs):
        '''
            Заполняет атрибуты экземпляра значениями в kwargs
        '''
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self,k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

    #deprecated:              
    def t_render_listeners(self):
        ''' Инкапсуляция над _listeners. Используется из шаблонов! '''
        return dict([(k,v) for k, v in self._listeners.items() if v!=None])
    
    def t_render_simple_listeners(self):
        return '{%s}' % ','.join(['%s:%s' % (k,v) for k, v in self._listeners.items() 
               if not isinstance(v, BaseExtComponent) and v!=None])

    def render_base_config(self):
        '''
        Рендерит базовый конфиг
        '''
        self._put_config_value('id', self.client_id)
        if self._listeners:
            self._put_config_value('listeners', 
                                   self.t_render_simple_listeners )
    
    def render_params(self):
        '''
        Рендерит дополнительные параметры
        '''
        pass
    
    def __check_unicode(self, string):
        '''
        Проверка на не юникодную строку в которой есть русские символы
        Если есть русские символы необходимо использовать юникод!
        '''
        try:
            unicode(string)
        except UnicodeDecodeError:
            raise Exception('"%s" is not unicode' % string)
        else:
            return string
    
    def _put_base_value(self, src_list, extjs_name, item, condition=True, 
                         depth = 0):
        '''
        Управляет правильной установкой (в зависимости от типа) 
        параметров контрола
        '''
        conf_dict = {}
        res = None
        if item == None or not condition:
            return
        elif callable(item):
            res = self.__check_unicode( item() )
            
        elif isinstance(item, basestring):
 
            # если в строке уже есть апостроф, то будет очень больно. 
            # поэтому replace
            res = "'%s'" % self.__check_unicode( item ).replace("'", "\\'")  
            
        elif isinstance(item, bool):
            res = str(item).lower()
            
        elif isinstance(item, int):    
            res = item
        
        elif isinstance(item, datetime.date):    
            res = None # нефиг даты передавать
        
        elif isinstance(item, dict):
            # рекурсивный обход вложенных свойств
            d_tmp = {}
            for k, v in item.items():
                prop = self._put_base_value(src_list = src_list, extjs_name = k, 
                                            item = v, depth = depth + 1)
                if prop:
                    d_tmp[k] = prop[k]
            res = d_tmp

        else:
            # Эээээ... Выводится для себя
            assert False, '"%s":"%s" not support' % (extjs_name, item)
        
        if res:
            conf_dict[extjs_name] = res
            if depth == 0:
                src_list.append(conf_dict)
            
            return conf_dict
        
    def _put_config_value(self, extjs_name, item, condition=True):
        '''
        Обертка для упаковки базового конфига
        '''
        self._put_base_value(self._config_list, extjs_name, item, condition)
        
    def _put_params_value(self, extjs_name, item, condition=True):
        '''
        Обертка для упаковки детализированного конфига компонента
        '''
        self._put_base_value(self._param_list, extjs_name, item, condition)
        
    def _set_base_value(self, src_list, key, value):
        '''
        Устанавливает значение по ключу
        '''
        def set_value_to_dict(src_dict, key, value):
            '''
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            '''
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    res = set_value_to_dict(v, key, value)
                    if res:
                        return True
                elif k == key:
                    if value:
                        src_dict[k] = value
                    else:
                        src_dict[k] = '""'
                    return True  
            return False
        
        for  item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            res = set_value_to_dict(item, key, value)
            if res:
                return True
        
        return False

    
    def _set_config_value(self, key, value):
        return self._set_base_value( self._config_list, key, value)
    
    def _set_params_value(self, key, value):
        return self._set_base_value( self._param_list, key, value)
    
    def _get_base_str(self, src_list):
        '''
        Возвращает структуру в json-формате
        @param src_list: Список словарей, словари могут быть вложенными 
        Пример структуры:
        [
            {...},
            {...},
            {
                {...},
                {...},
            }
        ] 
        '''
        def get_str_from_dict(src_dict):
            '''
            Вспомогательная функция, позволяет рекурсивно собрать все вложенные
            структуры-словари
            '''
            tmp_list = []
            for k, v in src_dict.items():
                if isinstance(v, dict):
                    tmp_list.append('%s:{%s}' % (k, get_str_from_dict(v) ) )
                else:
                    tmp_list.append('%s:%s' % (k,v) )
            return ','.join(tmp_list)
        
        tmp_list = []
        for  item in src_list:
            assert isinstance(item, dict), 'Nested structure must be dict type'
            tmp_list.append( get_str_from_dict(item) )
        
        return ','.join(tmp_list)
                
    def _get_config_str(self):
        '''
        Возвращает конфиг в формате json
        '''
        return self._get_base_str(self._config_list)
    
    def _get_params_str(self):
        '''
        Возрвращает доп. параметры в формате json
        '''
        return self._get_base_str(self._param_list)
            
#===============================================================================
class ExtUIComponent(BaseExtComponent):
    '''
        Базовый класс для компонентов визуального интерфейса
    '''
    def __init__(self, *args, **kwargs):
        super(ExtUIComponent, self).__init__(*args, **kwargs)
        self.style = {}
        self.hidden = False
        self.disabled = False
        self.height = self.width = None
        self.x = self.y = None
        self.html = None
        self.region = None
        self.flex = None # Для *box layout
        self.max_height = self.min_height = self.max_width = self.min_width = None
        self.name = None
        self.anchor = None
        self.cls = None
        # Атрибуты специфичные для form layout
        self.label_width = self.label_align = self.label_pad = None
        
    def t_render_style(self):
        return '{%s}' % ','.join(['"%s":"%s"' % (k, v) for k, v in self.style.items()])
    
    def render_base_config(self):
        super(ExtUIComponent, self).render_base_config()
        self._put_config_value('style', self.t_render_style, self.style)
        self._put_config_value('hidden', self.hidden)
        self._put_config_value('disabled', self.disabled)
        self._put_config_value('height', self.height)
        self._put_config_value('width', self.width)
        self._put_config_value('x', self.x)
        self._put_config_value('y', self.y)
        self._put_config_value('html', self.html)
        self._put_config_value('region', self.region)
        self._put_config_value('flex', self.flex)
        self._put_config_value('maxHeight', self.max_height)
        self._put_config_value('minHeight', self.min_height)
        self._put_config_value('maxWidth', self.max_width)
        self._put_config_value('minWidth', self.min_width)
        self._put_config_value('name', self.name)
        self._put_config_value('anchor', self.anchor)
        self._put_config_value('labelWidth', self.label_width)
        self._put_config_value('labelAlign', self.label_align)
        self._put_config_value('labelPad', self.label_pad)
        self._put_config_value('cls', self.cls)
        #return res
    
# TODO: закомментированный код ниже необходим для дальнейшей оптимизации
# рендеринга шаблонов. Все мелкие шаблоны (поля, столбцы грида, элементы меню и т.д.
# необходимо вынести напрямую в питоновский код
    
#def base_component_config(component):
#    '''
#    Возвращает часть скрипта конфигурации компонента
#    '''
#    def put_config_value(component, name, value):
#        if getattr(component, name, ''):
#            return '%s\n' % value
#        return ''
#    
#    result  = '%s\n' % component.client_id
#    result += put_config_value(component, 'disabled',   ',disabled: true')
#    result += put_config_value(component, 'hidden',     ',hidden: true')
#    result += put_config_value(component, 'width',      ',width: %s' % getattr(component, 'width', ''))
#    result += put_config_value(component, 'height',     ',height: %s' % getattr(component, 'height', ''))
#    result += put_config_value(component, 'html',       ',html: %s' % getattr(component, 'html', ''))
#    result += put_config_value(component, 'style',      ',style: {{ component.t_render_style|safe }} {% endif %}
#    result += put_config_value(component, 'x',          ',x: {{ component.x }} {% endif %}
#    result += put_config_value(component, 'y',          ',y: {{ component.y }} {% endif %}
#    result += put_config_value(component, 'region',     ',region: '{{ component.region }}' {% endif %}
#    result += put_config_value(component, 'flex',       ',flex: {{ component.flex }} {% endif %}
#    result += put_config_value(component, 'max_height', ',boxMaxHeight: {{ component.max_height }} {% endif %}
#    result += put_config_value(component, 'min_height', ',boxMinHeight: {{ component.min_height }} {% endif %}
#    result += put_config_value(component, 'max_width',  ',boxMaxWidth: {{ component.max_width }} {% endif %}
#    result += put_config_value(component, 'min_width',  ',boxMinWidth: {{ component.min_width }} {% endif %}
#    result += put_config_value(component, 'anchor',     ',anchor: '{{ component.anchor|safe }}' {% endif %}
    