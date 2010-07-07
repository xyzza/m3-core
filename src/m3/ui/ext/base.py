#coding:utf-8
'''
Модуль с базовыми классами/интерфейсами, которые необходимы
для работы подсистемы m3.ui.ext

Created on 01.03.2010

@author: akvarats
@author: prefer
'''

from uuid import uuid4

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
        self._listeners = {}
    
    def render(self):
        '''
        Возвращает "кусок" javascript кода, который используется для
        отображения самого компонента. За рендер полного javascript
        отвечает метод get_script()
        '''
        self.pre_render()
        return render_component(self)
    
    def render_globals(self):
        '''
            Рендерит и возвращает js-код, который помещен в template_globals
        '''
        self.pre_render_globals()
        if self.template_globals:
            return render_template(self.template_globals, {'component': self, 'self' : self})
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
        return 'id:"%s"' % self.client_id
   
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
        # Атрибуты специфичные для form layout
        self.label_width = self.label_align = self.label_pad = None
        
    def t_render_style(self):
        return '{%s}' % ','.join(['"%s":"%s"' % (k, v) for k, v in self.style.items()])
    
    def render_base_config(self):
        res = super(ExtUIComponent, self).render_base_config() or ''
        res += ',style:%s' % self.style if self.t_render_style() else ''
        res += ',hidden:%s' % str(self.hidden).lower() if self.hidden else ''
        res += ',disabled:%s' % str(self.disabled).lower() if self.disabled else ''
        res += ',height:%s' % self.height if self.height else ''
        res += ',width:%s' % self.width if self.width else ''
        res += ',x:%s' % self.x if self.x else ''
        res += ',y:%s' % self.y if self.y else ''
        res += ',html:%s' % self.html if self.html else ''
        res += ',region:"%s"' % self.region if self.region else ''
        res += ',flex:%s' % self.flex if self.flex else ''
        res += ',maxHeight:%s' % self.max_height if self.max_height else ''
        res += ',minHeight:%s' % self.min_height if self.min_height else ''
        res += ',maxWidth:%s' % self.max_width if self.max_width else ''
        res += ',minWidth:%s' % self.min_width if self.min_width else ''
        res += ',name:"%s"' % self.name if self.name else ''
        res += ',anchor:"%s"' % self.anchor if self.anchor else ''
        res += ',labelWidth:%s' % self.label_width if self.label_width else ''
        res += ',labelAlign:%s' % self.label_align if self.label_align else ''
        res += ',labelPad:"%s"' % self.label_pad if self.label_pad else ''
        return res
    
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
    