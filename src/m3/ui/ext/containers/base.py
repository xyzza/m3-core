#coding:utf-8
'''
Created on 25.02.2010

@author: prefer <telepenin@bars-open.ru>
'''

from m3.ui.ext.base import ExtUIComponent
from m3.helpers.datastructures import TypedList

class BaseExtContainer(ExtUIComponent):
    '''
    Базовый класс для контейнерных компонентов
    
    @version: 0.1
    @begin_designer
    {abstract: true
    ,attr: [{
        ext_attr: "layout"
        ,py_attr: "layout" 
    },{
        ext_attr: "layoutConfig"
        ,py_attr: "layout_config" 
        ,attr: {
             ext_attr: "forceFit"
            ,py_attr: "force_fit" 
        }
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtContainer, self).__init__(*args, **kwargs)
        
        # layout - атрибут, регламентирующий каким-образом отображать контрол
        self.layout = None
        
        # Конфигурация, специфичная для каждого layout
        self.layout_config = {}
        
        # Типизированный список контролов, находящихся в данном компоненте
        self._items = TypedList(type = ExtUIComponent)
        
    def t_render_items(self):
        ''' 
        @deprecated: Рекомендуется использовать render_base_config
        Дефолтный рендеринг вложенных объектов
        '''
        return '[%s]' % ','.join([item.render() for item in self._items])
        
    def find_by_name(self, name):
        '''
        Осуществляет поиск экземпляра во вложенных объектах по имени экземпляра и
        возвращает его, если тот был найден
        '''
        for item in self.items:   
            if hasattr(item, 'name') and name == getattr(item, 'name'):
                return item
                
            if hasattr(item, 'items'):
                res = item.find_by_name(name)
                if res:
                    return res
                
    def t_render_layout_config(self):
        '''
        @deprecated: Рекомендуется использовать render_base_config
        Рендерит конфиг, если указан layout
        '''
        return '{%s}' % ','.join(['%s:"%s"' % (k, v) for k, v in self.layout_config.items()])
    
    def pre_render(self):        
        #Вызывается до рендеринга контрола
        
        super(BaseExtContainer, self).pre_render()
        
        # выставляем action_context у дочерних элементов
        for item in self._items:
            if item:
                item.action_context = self.action_context
    
    def render_base_config(self):
        super(BaseExtContainer, self).render_base_config()
        self._put_config_value('layoutConfig', 
                                      self.t_render_layout_config,
                                      self.layout)
        self._put_config_value('layout', self.layout)
    
        
    def nested_components(self):
        '''
        Возвращаем список вложенных компонентов
        '''
        nested = super(BaseExtContainer, self).nested_components()
        nested.extend(self._items)
        
        return nested
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list,
                                             *args, **kwargs)
        # Выключаем\включаем компоненты.
        if self._items:
            for item in self._items:
                item.make_read_only(access_off, exclude_list, *args, **kwargs)
    
        
class BaseExtPanel(BaseExtContainer):
    '''
    Базовый класс для визуальных контейнерных компонентов
    
    @version: 0.1
    @begin_designer
    {abstract: true
    ,attr: [{
        ext_attr: "title"
        ,py_attr: "title" 
    },{
        ext_attr: "header"
        ,py_attr: "header" 
    },{
        ext_attr: "iconCls"
        ,py_attr: "icon_cls" 
    },{
        ext_attr: "tbar"
        ,py_attr: "top_bar" 
    },{
        ext_attr: "bbar"
        ,py_attr: "bottom_bar" 
    },{
        ext_attr: "fbar"
        ,py_attr: "footer_bar" 
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtPanel, self).__init__(*args, **kwargs)
        self.title = None
        self.header = False
        self.icon_cls = None
        self.top_bar = None
        self.bottom_bar = None
        self.footer_bar = None
        self.dd_group = None
        self.border = True

    def t_render_top_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.top_bar.render()
    
    def t_render_bottom_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.bottom_bar.render()
    
    def t_render_footer_bar(self):
        #TODO: Использовать lambda функцию в render_base_config
        return self.footer_bar.render()
    
    def render_base_config(self):
        super(BaseExtPanel, self).render_base_config()
        self._put_config_value('title', self.title)
        self._put_config_value('border', self.border)
        if not self.title:
            self._put_config_value('header', self.header)
            
        self._put_config_value('iconCls', self.icon_cls)
        self._put_config_value('ddGroup', self.dd_group)
        self._put_config_value('tbar', self.t_render_top_bar, 
                                      self.top_bar)
        self._put_config_value('bbar', self.t_render_bottom_bar, 
                                      self.bottom_bar)
        self._put_config_value('fbar', self.t_render_footer_bar,
                                      self.footer_bar)
        
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        #FIXME: нельзя использовать в качестве умолчательных параметров
        # изменяемые типы. Это может привести к неприятным side эффектам
        
        # Описание в базовом классе ExtUiComponent.
        # вызываем родительский метод для итемов.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, 
                                             *args, **kwargs)
        # Выключаем\включаем компоненты.
        super(BaseExtPanel, self).make_read_only(access_off, exclude_list,
                                                 *args, **kwargs)
        bar_typle = (self.footer_bar, self.bottom_bar, self.top_bar)
        for bar in bar_typle:    
            if bar and bar._items:
                # Обязательно проверяем, что пришел контейнер.
                assert isinstance(bar, BaseExtContainer)
                for item in bar._items:
                    item.make_read_only(access_off, exclude_list, *args, **kwargs)