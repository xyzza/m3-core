#coding:utf-8
'''
Всё, что связано с пользовательским интерфейсом

Created on 28.09.2010

@author: akvarats
'''

from m3.helpers import server_admin

from m3.ui import actions
from m3.ui.ext import windows, controls, panels

import helpers
from m3.ui.actions.context import ActionContextDeclaration

class PluginsActionPack(actions.ActionPack):
    '''
    Хранит действия подсистемы плагинов
    '''
    url = '/plugins'
    def __init__(self):
        self.actions = [
            Action_ShowPluginManagerWindow(),
            Action_GetInstalledPlugins(),
            Action_RestartApplicationServer(),
            Action_ActivatePlugin(),
            Action_DeactivatePlugin(),
        ]

class Action_ShowPluginManagerWindow(actions.Action):
    
    url = '/manager-window'
    
    def run(self, request, context):
        window = PluginsManagerWindow()
        
        return actions.ExtUIScriptResult(window)
    
class Action_GetInstalledPlugins(actions.Action):

    url = '/installed-plugins'
    
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(data = helpers.mark_activated_plugins(helpers.get_installed_plugins())) 

class Action_RestartApplicationServer(actions.Action):
    
    url = '/reload-server'
    
    def run(self, request, context):
        server_admin.WebServerAdmin.restart_server()
        return actions.OperationResult(success=True)

class Action_ActivatePlugin(actions.Action):
    
    url = '/activate-plugin'
    
    def context_declaration(self):
        return [
            ActionContextDeclaration(name='plugin_name', type=str, required=True),
        ]
    
    def run(self, request, context):
        try:
            helpers.activate_plugin(context.plugin_name)
            return actions.OperationResult(success=False, message=u'Плагин ' + context.plugin_name + u' успешно активирован.\n\nПерегрузите сервер приложений для того,\nчтобы изменения вступили в силу')
        except:
            return actions.OperationResult(success=False, message=u'Не удалось активировать плагин. Подробности неудачной операции в логах системы.')

class Action_DeactivatePlugin(actions.Action):
    
    url = '/deactivate-plugin'
    
    def context_declaration(self):
        return [
            ActionContextDeclaration(name='plugin_name', type=str, required=True),
        ]
    
    def run(self, request, context):
        try:
            helpers.deactivate_plugin(context.plugin_name)
            return actions.OperationResult(success=False, message=u'Плагин ' + context.plugin_name + u' успешно деактивирован.\n\nПерегрузите сервер приложений для того,\nчтобы изменения вступили в силу')
        except:
            return actions.OperationResult(success=False, message=u'Не удалось деактивировать плагин. Подробности неудачной операции в логах системы.')

#===============================================================================
# UI 
#===============================================================================

class PluginsManagerWindow(windows.ExtWindow):
    '''
    Окно менеджера плагинов
    '''
    def __init__(self, *args, **kwargs):
        super(PluginsManagerWindow, self).__init__(*args, **kwargs)
        self.title = u'Управление плагинами'
        self.maximizable = True
        self.width = 800
        self.height = 500
        self.layout = 'fit'
        self.template_globals = 'm3-plugins-manager-window.js'
        self.buttons.append(controls.ExtButton(text=u'Перезагрузить сервер', handler='restartApplicationServer'))
        self.buttons.append(controls.ExtButton(text=u'Закрыть', handler='closeWindow'))
        self.action_restart_server = Action_RestartApplicationServer
        
        self.activate_plugin_action = Action_ActivatePlugin
        self.deactivate_plugin_action = Action_DeactivatePlugin
        
        #=======================================================================
        # Грид с установленными плагинами
        #=======================================================================
        self.grid_plugins = panels.ExtObjectGrid()
        self.grid_plugins.allow_paging = True
        self.grid_plugins.add_column(header='Название плагина', width=200, data_index='name')
        self.grid_plugins.add_column(header='Версия', width=100, data_index='verbose_version')
        self.grid_plugins.add_column(header='Статус', width=100, data_index='ui_status')
        self.grid_plugins.add_column(header='Описание', width=500, data_index='description')
        self.grid_plugins.action_data = Action_GetInstalledPlugins
        #self.grid_plugins.action_new = Action_GetInstalledPlugins
        self.grid_plugins.context_menu_row.add_item(text = u'Активировать плагин', handler='contextMenuActivatePlugin')
        self.grid_plugins.context_menu_row.add_item(text = u'Деактивировать плагин', handler='contextMenuDeactivatePlugin')
        self.grid_plugins.context_menu_row.handler_beforeshow = 'contextMenuAllPluginsOpen'
        self.items.append(self.grid_plugins)
        self.init_component(*args, **kwargs)
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        