#coding:utf-8
'''
Created on 21.11.2010

@author: akvarats
'''

from m3.ui.ext import windows
from m3.ui.ext import controls
from m3.ui.ext import panels

class SimpleWindow(windows.ExtWindow):
    '''
    Простое окно, которое не содержит никаких дочерних элементов
    '''
    def __init__(self):
        super(SimpleWindow, self).__init__()
        
        self.ok_button = controls.ExtButton(text=u'ОК')
        self.cancel_button = controls.ExtButton(text=u'Отмена')
        
        self.buttons.extend([self.ok_button, self.cancel_button])