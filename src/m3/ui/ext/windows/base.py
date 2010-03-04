#coding: utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.renderers import ExtWindowRenderer
from m3.ui.ext import render_component
from m3.ui.ext import render_template

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
            layuot - Тип расположения контейнера
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
        self.title = ''
        self.top_container = None
        self.buttons = []
        
        self.layuot = ''
        self.modal = self.maximizable = self.minimizable = self.maximized = self.minimized = False
        
    def render_buttons(self):
#        js = 'buttons:['
#        for button in self.buttons:
#            js += button.render() + ','
#        if js[-1] == ',':
#            js = js[0:len(js)-1]
#        return js + ']'
        return 'buttons:[%s]' % ','.join([button.render() for button in self.buttons])
    
    def render(self):
        return render_component(self)
    
    def render_globals(self):
        if self.template_globals:
            return render_template(self.template_globals, {'window': self})
        return ''