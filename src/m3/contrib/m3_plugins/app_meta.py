#coding:utf-8
'''
Created on 01.10.2010

@author: akvarats
'''

from m3.ui.actions import default_controller, OperationResult
from ui import PluginsActionPack, Action_ShowPluginManagerWindow

def register_actions():
    '''
    Регистрация экшенов в контроллерах
    '''
    default_controller.packs.append(PluginsActionPack)