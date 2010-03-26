#coding: utf-8

'''
Created on 9.03.10

@author: prefer
'''

from base import BaseExtWindow
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtGrid, ExtGridColumn

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
       
    # Свойство, отображающее grid на top_container для правильного рендеринга   
    @property
    def grid(self):
        return self.__grid
    
    @grid.setter
    def grid(self, value):
        self.top_container = value
        self.__grid = value
   
    @property
    def select_dict_button(self):
        '''
            Свойство для быстрого доступа к кнопке выбора значения
        '''
        return self.buttons[0]
    
    @property
    def cancel_dict_button(self):
        '''
            Свойство для быстрого доступа к кнопке отмены значения
        '''
        return self.buttons[1]
    
    def __get_field_id(self, request):
        '''
            Инкапсуляция над выбором id текстового поля из запроса с клиента
        '''
        return request.GET.get('field_id')
    
    def set_attr(self, id='', text=''):
        '''
            Говорит о том, из какой колонки будет браться id значения, а из какого text
        '''
        self.attr_id = id
        self.attr_text = text
        