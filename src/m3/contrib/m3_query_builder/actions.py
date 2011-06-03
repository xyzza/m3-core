#coding:utf-8 
'''
Date&Time: 01.06.11 10:38
@author: kir
'''
import json

from m3.ui import actions
from m3.helpers import urls as m3urls

from m3.contrib.m3_query_builder import EntityCache

import ui


class QueryBuilderActionsPack(actions.ActionPack):
    '''
    Экшенпак работы с конструктором запросов
    '''
    url = '/qb-pack'
    shortname = 'm3-query-builder-main-actions'

    def __init__(self):
        super(QueryBuilderActionsPack, self).__init__()
        self.actions.extend([QueryBuilderWindowAction(),
                             SelectConnectionWindowAction(),
                             EntitiesListAction()])

class QueryBuilderWindowAction(actions.Action):
    '''
    Запрос на получение окна конструктора запросов
    '''
    url = '/main-window'
    shortname = 'm3-query-builder-window'

    def run(self, request, context):
        params = {'select_connections_url': m3urls.get_action('m3-query-builder-select-connection').absolute_url()}
        window = ui.queryBuilderWindow(params=params)
        return actions.ExtUIScriptResult(data=window)

class SelectConnectionWindowAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/select-connection-window'
    shortname = 'm3-query-builder-select-connection'

    def run(self, request, context):
        win = ui.selectConnectionsWindow()
        return actions.ExtUIScriptResult(data=win)
    

class EntitiesListAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/entities-list'
    shortname = 'm3-query-builder-entities-list'

    def run(self, request, context):
        entities = EntityCache.get_entities()        
        data = {}
        return actions.JsonResult(json.dumps(data))