#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.renderers import ExtWindowRenderer
from m3.ui.ext import render_template

from m3.helpers.datastructures import TypedList
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from m3.ui.ext.controls import ExtButton

class BaseExtWindow(ExtUIComponent):
    '''
    Базовый класс для всех окон в системе
    '''
    def __init__(self, *args, **kwargs):
        '''
        Атрибуты экземпляров:
            template - Шаблон для рендеринга
            template_globals - Шаблон произвольных функций
            renderer - Ссылка на объект ExtWindowRenderer() 
            
            width - Ширина
            height - Высота
            title - Заголовок
            top_container - Контейнер для содержащихся на форме элементов
            buttons - Имеющиеся кнопки
            layout - Тип расположения контейнера
            modal - Модальное окно
            maximizable - Возможность развернуть на весь экран
            minimizable - Возможность свернуть
            maximized - Развернута на весь экран
            minimized - Свернута
        '''
        super(BaseExtWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.template_globals = ''
        self.renderer = ExtWindowRenderer()
        self.renderer.window = self
        
        # параметры окна
        self.width = 400
        self.height = 300
        self.title = None
        self.top_container = None
        self.__buttons = TypedList(type=ExtButton)
        
        self.layout = None
        self.modal = self.maximizable = self.minimizable = self.maximized = self.minimized = False
        self.closable = True
        self.body_style = 'padding:5px;'
        self.icon_cls = None
        
    @property
    def buttons(self):
        return self.__buttons
        
    def t_render_buttons(self):
        return 'buttons:[%s]' % ','.join([button.render() for button in self.buttons])
    
    def render_globals(self):
        if self.template_globals:
            return render_template(self.template_globals, {'component': self, 'window': self})
        return ''
    