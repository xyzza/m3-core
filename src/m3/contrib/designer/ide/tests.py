#coding: utf-8

from m3.ui.ext.windows import ExtWindow
from m3.ui.ext.containers.forms import ExtPanel
from m3.ui.ext.fields.simple import ExtStringField


class TestOne(ExtWindow):
    '''©
    Простой класс'''

    def __init__(self, *args, **kwargs):
        '''©
        Конструктор класса
        '''
        super(TestOne, self).__init__(*args, **kwargs)
        self.initialize()

    def initialize(self):
        '''©
        AUTOGENERATIONS! Не редактировать!!
        DO No Touch
        '''
        self.layout = 'fit'
        self.name = 'Ext window'
        self.title = 'Trololo'
        base_panel = ExtPanel()
        base_panel.layout = 'absolute'
        base_panel.name = 'Ext panel'
        base_panel.title = 'Im panel '
        simple_form = ExtForm()
        simple_form.layout = 'form'
        simple_form.name = 'Ext form'
        simple_form.title = 'Im form '
        inner_panel = ExtPanel()
        inner_panel.width = 100
        inner_panel.layout = 'absolute 2'
        inner_panel.name = 'Ext panel'
        inner_panel.title = 'Im panel 2'
        
        f = ExtStringField()
        f.anchor = '100%'        
        inner_panel._items.append(f)
        
        self._items.append(base_panel)
        self._items.append(simple_form)
        simple_form._items.append(inner_panel)

    def ata(self):
        pass