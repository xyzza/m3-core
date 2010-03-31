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
from m3.ui.ext.containers import ExtContainer, ExtToolbar, ExtContextMenu
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
        '''Свойство, отображающее grid на top_container для правильного рендеринга'''
        return self.__grid
    
    @grid.setter
    def grid(self, value):
        self.top_container = value
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
        top_cont = ExtContainer(layout='column', region='north')
        top_cont.items.append(text_cont)
        top_cont.items.append(search_btn)
        
        grid = ExtGrid()
        grid.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=True))
        
        row_menu = ExtContextMenu()
        row_menu.add_item(text=u'Новый')
        row_menu.add_item(text=u'Добавить')
        row_menu.add_item(text=u'Удалить')
        grid.handler_rowcontextmenu = row_menu
        
        menu = ExtContextMenu()
        menu.add_item(text=u'Новый')
        grid.handler_contextmenu = menu
        
        grid_cont = ExtContainer(flex=1, height=400, layout='fit')
        grid_cont.items.append(grid)
        
        tbar = ExtToolbar(width=20, )
        tbar.items.append(ExtButton(text=u'Новый'))
        tbar.items.append(ExtButton(text=u'Изменить'))
        tbar.items.append(ExtButton(text=u'Удалить'))
        tbar_cont = ExtContainer(style={'padding-right':'1px'})
        tbar_cont.items.append(tbar)
        
        middle_cont = ExtContainer(layout='hbox')
        middle_cont.items.append(tbar_cont)
        middle_cont.items.append(grid_cont)
        
        main_cont = ExtContainer(region='center')
        main_cont.items.append(top_cont)
        main_cont.items.append(middle_cont)
        
        self.top_container = main_cont
        
        self.buttons.append(ExtButton(text = u'Выбрать'))
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
        
        # Основные контролы сохраним для дальнейшего доступа к ним 
        self.grid = grid
        self.toolbar = tbar
        self.grid_row_menu = row_menu
        self.grid_menu = menu
        self.search_text = search
        self.search_button = search_btn
        
        self.init_component(*args, **kwargs)
        