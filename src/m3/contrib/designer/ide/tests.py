#coding: utf-8

from m3.ui.ext.windows import ExtWindow
from m3.ui.ext.containers.forms import ExtPanel
from m3.ui.ext.fields.simple import ExtStringField


class TestOne(ExtWindow):
    """©
    Простой класс"""

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
        self.width = 200
        self.height = 300

    def ata(self):
        pass