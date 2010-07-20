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
        '''
        Рендерит базовый конфиг
        '''
        res = self._put_config_value('id', self.client_id, first_value = True)
        res += self._put_config_value('listeners', self.t_render_simple_listeners, self._listeners)
        return res
    
    def render_params(self):
        '''
        Рендерит дополнительные параметры
        '''
        return ''
    
    def _put_config_value(self, extjs_name, item, condition=True, 
                          first_value=False):
        '''
        Управляет правильной установкой (в зависимости от типа) 
        параметров контрола
        '''
        if item == None:
            return ''
        elif callable(item):
            res = ('%s:%s' % (extjs_name, item() ) if condition else '')
        elif isinstance(item, basestring):
            # Проверка на не юникодную строку. Если есть русские символы 
            # необходимо использовать юникод 
            try:
                u'' + item
            except UnicodeDecodeError:
                raise Exception('"%s" is not unicode' % item)
            
            res =  ('%s:"%s"' % (extjs_name, item) if condition and item else '')
        elif isinstance(item, bool):
            res = ('%s:%s' % (extjs_name, str(item).lower()) if condition else '')
        elif isinstance(item, int):
            res = ('%s:%s' % (extjs_name, item) if condition and item else '')      
        else:
            assert False, 'This is sparta!!! Madness!'
            
        if res:
            return res if first_value else ',%s' % res
        else:
            return ''
   
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
        res += self._put_config_value('style', self.t_render_style, self.style)
        res += self._put_config_value('hidden', self.hidden)
        res += self._put_config_value('disabled', self.disabled)
        res += self._put_config_value('height', self.height)
        res += self._put_config_value('width', self.width)
        res += self._put_config_value('x', self.x)
        res += self._put_config_value('y', self.y)
        res += self._put_config_value('html', self.html)
        res += self._put_config_value('region', self.region)
        res += self._put_config_value('flex', self.flex)
        res += self._put_config_value('maxHeight', self.max_height)
        res += self._put_config_value('minHeight', self.min_height)
        res += self._put_config_value('maxWidth', self.max_width)
        res += self._put_config_value('minWidth', self.min_width)
        res += self._put_config_value('name', self.name)
        res += self._put_config_value('anchor', self.anchor)
        res += self._put_config_value('labelWidth', self.label_width)
        res += self._put_config_value('labelAlign', self.label_align)
        res += self._put_config_value('labelPad', self.label_pad)
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
    