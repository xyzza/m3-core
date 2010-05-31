#coding: utf-8
'''
Created on 26.05.2010

@author: akvarats
'''
from base import BaseExtWindow
from m3.ui.ext import containers
from m3.ui.ext import misc
from m3.ui.ext import menus
from m3.ui.ext import controls
from m3.ui.ext import panels  

class BaseExtListWindow(BaseExtWindow):
    '''
    Базовое окно со списком записей. 
    ''' 
    def __init__(self, *args, **kwargs):
        super(BaseExtListWindow, self).__init__(*args, **kwargs)
        
        self.template = 'ext-windows/ext-list-window.js'
        
        self.layout = 'border'
        self.width = 800
        self.height = 600
        self.maximized = True
        
        # грид, который будем все для нас делать
        self.grid = panels.ExtObjectGrid(region='center')
        self.items.append(self.grid)