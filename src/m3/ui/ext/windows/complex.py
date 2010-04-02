#coding: utf-8

'''
Created on 9.03.10

@author: prefer
'''

from base import BaseExtWindow
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtGrid, ExtGridColumn

from m3.ui.ext.fields import ExtStringField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtContainer, ExtToolbar, ExtContextMenu, ExtPanel, ExtListView
from m3.ui.ext.misc import ExtJsonStore

class ExtDictSelectWindow(BaseExtWindow):
    def __init__(self, request, *args, **kwargs):
        super(ExtDictSelectWindow, self).__init__(*args, **kwargs)
        
        self.field_id = self.__get_field_id(request)
        self.title = u'Форма выбора значения'
        
        self.layout = 'fit'
        self.grid = ExtGrid()
        self.buttons.append(ExtButton(text = u'Выбрать'))
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
             
        self.template_globals = 'ext-script/ext-button-select-window.js'  
        self.attr_id  = ''
        self.attr_text = ''
        
        self.init_component(*args, **kwargs)
    
    def t_render_buttons(self):
        return 'buttons:[%s]' % ','.join([button.render() for button in self.buttons])
         
    @property
    def grid(self):
        '''Свойство, отображающее grid на items для правильного рендеринга'''
        return self.__grid
    
    @grid.setter
    def grid(self, value):
        self.items.append(value)
        self.__grid = value
   
    @property
    def select_dict_button(self):
        '''Свойство для быстрого доступа к кнопке выбора значения'''
        return self.buttons[0]
    
    @property
    def cancel_dict_button(self):
        '''Свойство для быстрого доступа к кнопке отмены значения'''
        return self.buttons[1]
    
    def __get_field_id(self, request):
        '''Инкапсуляция над выбором id текстового поля из запроса с клиента'''
        return request.GET.get('field_id')
    
    def set_attr(self, id='', text=''):
        '''Говорит о том, из какой колонки будет браться id значения, а из какого text'''
        self.attr_id = id
        self.attr_text = text
        
        
class ExtDictionaryWindow(BaseExtWindow):
    ''' Базовое окно для простого линейного справочника '''
    def __init__(self, *args, **kwargs):
        super(ExtDictionaryWindow, self).__init__(*args, **kwargs)
        self.template = 'ext-windows/ext-window.js'
        self.layout='border'
        
        search = ExtStringField(label = u'Поиск')
        text_cont = ExtContainer(layout='form', style={'padding':'5px'})
        text_cont.items.append(search)
        
        search_btn = ExtButton(text = u'Найти', style={'padding':'5px'})
        top_cont = ExtContainer(region='north',layout='column', min_height=35)
        top_cont.items.append(text_cont)
        top_cont.items.append(search_btn)
        
        grid = ExtGrid(region='center')
        
        row_menu = ExtContextMenu()
        grid.handler_rowcontextmenu = row_menu
        
        menu = ExtContextMenu()
        grid.handler_contextmenu = menu
        
        tbar = ExtToolbar(region='west', min_width=20)

        self.items.append(top_cont)
        self.items.append(grid)
        self.items.append(tbar)
        
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
        
        # Основные контролы должны быть доступны для изменения
        self.grid = grid
        self.toolbar = tbar
        self.grid_row_menu = row_menu
        self.grid_menu = menu
        self.list_view = None
        self.search_text = search
        self.search_button = search_btn
        self.select_button = None
        self.__panel_list_view = None
        
        # Окно может находится в двух положениях: просто список записей и список выбора записи/записей
        self.__mode = 0 # По умолчанию справочник открыт в режиме списка
     
        # Добавляются пункты в меню и на тулбар
        self.__add_menu_item(0, text=u'Новый')
        self.__add_menu_item(1, text=u'Добавить')
        self.__add_menu_item(1, text=u'Удалить')
     
        self.init_component(*args, **kwargs)
        
    @property
    def mode(self):
        return self.__mode
    
    @mode.setter
    def mode(self, value):
        assert value in (0,1), 'Mode only 1 (select mode) or 0 (list mode)'

        if value==1:
            buttom_panel = ExtPanel(title='История выбора',
                                region='south',min_height=100, collapsible=True, split=True)
            list_view = ExtListView() 
            buttom_panel.items.append(list_view)
            self.items.append(buttom_panel)
        
            select_btn = ExtButton(text = u'Выбрать')
            self.buttons.insert(0, select_btn)
            
            self.select_button = select_btn
            self.__panel_list_view = buttom_panel
            self.list_view = list_view
        elif value==0:
            if self.__panel_list_view:
                self.items.remove(self.__panel_list_view)
                self.list_view = None
                self.__panel_list_view = None
            if self.select_button:
                self.buttons.remove(self.select_button)
                self.select_button = None

        self.__mode = value
        
    def __add_menu_item(self, flag, **kwargs):
        '''
        @param flag: Указывает как будет добавляться пункт,
                    0 - Добавляется в тублар, в конт. меню строки, в меню всего грида
                    1 - Добавляется в тублар, в конт. меню строки
        '''
        if flag==0:
            self.toolbar.items.append(ExtButton(**kwargs))
            self.grid_row_menu.add_item(**kwargs)
            self.grid_menu.add_item(**kwargs)
        elif flag==1:
            self.toolbar.items.append(ExtButton(**kwargs))
            self.grid_row_menu.add_item(**kwargs)
        else:
            assert False, 'Flag must be 1 or 0'
        