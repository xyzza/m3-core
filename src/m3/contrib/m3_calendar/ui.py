#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''
from m3.ui.ext.containers.forms import ExtPanel
from m3.ui.ext.windows.window import ExtWindow

class M3CalendarWindow(ExtWindow):
    '''Окно с маленькими календарями для всех месяцев в году'''
    def __init__(self, *args, **kwargs):
        super(M3CalendarWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.panel = ExtPanel(layout)
        self.items.append(self.panel)
        self.title = u'Календарь рабочих и выходных дней'
        self.width = 700
        self.height = 500