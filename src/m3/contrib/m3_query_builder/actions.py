#coding:utf-8 
'''
Date&Time: 01.06.11 10:38
@author: kir
'''
from m3.ui import actions
from m3.helpers import urls as m3urls

import ui

class QueryBuilderActionsPack(actions.ActionPack):
    '''
    Экшенпак работы с конструктором запросов
    '''
    url = '/main'
    shortname = 'm3-query-builder-main-actions'

    def __init__(self):
        super(QueryBuilderActionsPack, self).__init__()
        self.actions.extend([QueryBuilderWindowAction(),
                             SelectConnection()])

class QueryBuilderWindowAction(actions.Action):
    '''
    Запрос на получение окна конструктора запросов
    '''
    url = '/query-builder-window'
    shortname = 'm3-query-builder-window'

    def run(self, request, context):
        params = {'select_connections_url': m3urls.get_action('m3-query-builder-select-connection').absolute_url()}
        window = ui.queryBuilderWindow(params=params)
        return actions.ExtUIScriptResult(data=window)

class SelectConnection(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/query-builder-select-connection'
    shortname = 'm3-query-builder-select-connection'

    def run(self, request, context):
        win = ui.selectConnectionsWindow()
        return actions.ExtUIScriptResult(data=win)