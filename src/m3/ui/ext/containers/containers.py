#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
@author: prefer <telepenin@bars-open.ru>
'''
from base import BaseExtContainer
from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.controls import ExtButton

#===============================================================================
class ExtContainer(BaseExtContainer):
    '''
    Класс, имитирующий работу Ext.Container
    
    @version: 0.1
    @begin_designer
    {title: "Container"
    ,ext_class: "Ext.Container"
    ,xtype: "container"
    ,attr: [{
        ext_attr: "items"
        ,py_attr: "items" 
    }]}
    @end_designer
    
    '''
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.Container'
        self.init_component(*args, **kwargs)
    
    @property
    def items(self):
        return self._items
    
    def render_base_config(self):
        super(ExtContainer, self).render_base_config()
        if self._items:
            self._put_config_value('items', self.t_render_items)

    def render(self):
        #self.style['overflow'] = 'hidden' #делается для хака IE иначе иногда дочерние элементы ведут себя словно у них задано position: fixed т.е. начинаю неадекватничать   
        assert getattr(self, '_ext_name'), 'Class %s is not define "_ext_name"' % \
            (self.__class__.__name__,)
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
                            
        return 'new %s' % res if not self._is_function_render else res
    
#===============================================================================    
class ExtToolBar(BaseExtContainer):
    '''
    Класс, имитирующий работу Ext.Toolbar
    
    Атрибуты для дизайнера:
    @designer: Tool Bar
    @ext_class: Ext.Toolbar
    @xtype: toolbar
    
    @version: 0.1
    @begin_designer
    {title: "Tool Bar"
    ,ext_class: "Ext.Toolbar"
    ,xtype: "toolbar"
    }
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtToolBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.Toolbar'
        self._items = []
        self.init_component(*args, **kwargs)
    
    def t_render_items(self):
        res = []
        for item in self.items:
            # Если объект структуры классов, то пусть сам рендерится, 
            # если нет - так как есть.
            if isinstance(item, ExtUIComponent):
                res.append(item.render()) 
            else:
                res.append(item)        
        return '[%s]' % ','.join(res)
        
    def add_fill(self):
        self.items.append(ExtStaticToolBarItem('"->"'))
                
    def add_separator(self):
        self.items.append(ExtStaticToolBarItem('"-"'))
                
    def add_spacer(self, width=2):
        self.items.append(ExtStaticToolBarItem("{xtype: 'tbspacer', width: %d}" % width))
                
    def add_text_item(self, text_item):
        self.items.append(ExtStaticToolBarItem('"%s"' % text_item))
        
    def add_menu(self, **kwargs):
        self.items.append(ExtToolbarMenu(**kwargs))
          
    @property
    def items(self):
        return self._items
    
    def render_base_config(self):
        super(ExtToolBar, self).render_base_config()
        if self.items:
            self._put_config_value('items', self.t_render_items)
    
    def render(self):
        assert getattr(self, '_ext_name'), 'Class %s is not define "_ext_name"' % \
            (self.__class__.__name__,)
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
        
        return 'new %s' % res if not self._is_function_render else res
    
#===============================================================================
# Преднастроенные элементы в тулбаре
class ExtStaticToolBarItem(ExtUIComponent):
    def __init__(self, static_value = '', *args, **kwargs):
        super(ExtStaticToolBarItem, self).__init__(*args, **kwargs)
        self.static_value = static_value
        self.init_component(*args, **kwargs)
        
    def render(self):
        return self.static_value
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass

#===============================================================================
class ExtTextToolBarItem(ExtUIComponent):
    def __init__(self, static_value = '', *args, **kwargs):
        super(ExtTextToolBarItem, self).__init__(*args, **kwargs)
        self.text = None
        self.init_component(*args, **kwargs)
    def render(self):
        return "{xtype: 'tbtext', text: '%s'}" % self.text
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        pass
        
#===============================================================================    
class ExtPagingBar(BaseExtContainer):   
    '''
    Класс, имитирующий работу Ext.PagingToolbar
    
    @version: 0.1
    @begin_designer
    {title: "Paging Bar"
    ,ext_class: "Ext.PagingToolbar"
    ,xtype: "paging"
    ,attr: [{
        ext_attr: "pageSize"
        ,py_attr: "page_size" 
        ,default_value: 25
    },{
        ext_attr: "displayMsg"
        ,py_attr: "display_message"
        ,default_value: "Показано записей {0} - {1} из {2}"
    },{
        ext_attr: "empty_message"
        ,py_attr: "emptyText"
        ,default_value: "Нет записей"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtPagingBar, self).__init__(*args, **kwargs)
        self._ext_name = 'Ext.PagingToolbar'
        
        self.page_size = 25
        self.display_message = u'Показано записей {0} - {1} из {2}'
        self.empty_message = u'Нет записей'
        self.init_component(*args, **kwargs)
        
    def render_base_config(self):
        super(ExtPagingBar, self).render_base_config()
        self._put_config_value('pageSize', self.page_size)
        self._put_config_value('displayInfo', True)
        self._put_config_value('displayMsg', self.display_message)
        self._put_config_value('emptyMsg', self.empty_message)
        
    def render(self):
        assert getattr(self, '_ext_name'), 'Class %s is not define "_ext_name"' % \
            (self.__class__.__name__,)
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
        
        return 'new %s' % res if not self._is_function_render else res
         
#===============================================================================
class ExtToolbarMenu(ExtUIComponent):
    '''
    Класс, позволяющий легко вставлять меню в ToolBar
    '''
    def __init__(self, *args, **kwargs):
        super(ExtToolbarMenu, self).__init__(*args, **kwargs)
        self.text = None
        self.icon_cls = None
        self.tooltip_text = None
        self.menu = None
        self.init_component(*args, **kwargs)
        
    def render(self):
        res = 'id:"%s"' % self.client_id
        if self.text:
            res = 'text: "%s"' % self.text
        if self.icon_cls:
            res += ',iconCls: "%s"' % self.icon_cls
        if self.tooltip_text:
            res += ',tooltip: "%s"' % self.tooltip_text
        if self.menu:
            res += ',menu: %s' % self.menu.render()
            
        return '{%s}' % res
    
    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        if self.menu:
            self.menu.make_read_only(access_off, exclude_list, *args, **kwargs)

    
#===============================================================================
class ExtButtonGroup(BaseExtContainer):
    '''
    Класс, имитирующий работу Ext.ButtonGroup
    
    @version: 0.1
    @begin_designer
    {title: "Button Group"
    ,ext_class: "Ext.ButtonGroup"
    ,xtype: "buttongroup"
    }
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtButtonGroup, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-button-group.js'
        self.columns_number = None
        self.title = None
        self.init_component(*args, **kwargs)  
    
    def add_button(self, **kwargs):
        self.buttons.append(ExtButton(**kwargs))
    
    def t_render_buttons(self):
        return '[%s]' % self.t_render_items()
   
    @property
    def buttons(self):
        return self._items
    