#coding:utf-8 
'''
Date&Time: 01.06.11 10:38
@author: kir
'''
from m3.ui import actions
import ui

class QueryBuilderActionsPack(actions.ActionPack):
    '''
    Экшенпак работы с конструктором запросов
    '''
    url = '/main'
    shortname = 'm3-query-builder-main-actions'

    def __init__(self):
        super(QueryBuilderActionsPack, self).__init__()
        self.actions.append(QueryBuilderWindowAction())

class QueryBuilderWindowAction(actions.Action):
    '''
    Запрос на получение окна конструктора запросов
    '''
    url = '/query-builder-window'
    shortname = 'm3-contragents-contacts-window'

    def run(self, request, context):
        window = ui.queryBuilderWindow()
        return actions.ExtUIScriptResult(data=window)