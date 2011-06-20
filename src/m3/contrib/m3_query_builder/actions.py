#coding:utf-8 

import json

from django.core.exceptions import ValidationError

from m3.ui import actions
from m3.ui.actions import ACD

import ui
from api import get_entities, get_entity_items, build_entity, get_conditions, \
    get_aggr_functions, save_query
from m3.helpers import logger


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
                             EntitiesListAction(), 
                             EntitiyItemsListAction(),
                             ConditionWindowAction(),
                             ShowQueryTextAction(),
                             SaveQueryAction()])

class QueryBuilderWindowAction(actions.Action):
    '''
    Запрос на получение окна конструктора запросов
    '''
    url = '/main-window'
    shortname = 'm3-query-builder-window'

    def run(self, request, context):
        params = {'select_connections_url': SelectConnectionWindowAction.absolute_url(),
                  'entity_items_url': EntitiyItemsListAction.absolute_url(),
                  'condition_url': ConditionWindowAction.absolute_url(),
                  'query_text_url': ShowQueryTextAction.absolute_url(),
                  'save_query_url': SaveQueryAction.absolute_url()}
        window = ui.QueryBuilderWindow(params=params)
        window.set_aggr_functions( get_aggr_functions())
        return actions.ExtUIScriptResult(data=window)

class SelectConnectionWindowAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/select-connection-window'
    shortname = 'm3-query-builder-select-connection'

    def run(self, request, context):
        win = ui.SelectConnectionsWindow()        
        return actions.ExtUIScriptResult(win)
    

class EntitiesListAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/entities-list'
    shortname = 'm3-query-builder-entities-list'

    def run(self, request, context):           
        entities = get_entities()                
        return actions.JsonResult('[%s]' % ','.join(entities))
    
    
class EntitiyItemsListAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/entity-items-list'
    shortname = 'm3-query-builder-entity-items-list'

    def context_declaration(self):
        return [ACD(name='entity_name', type=unicode, required=True)]

    def run(self, request, context):           
        entity_items = get_entity_items(context.entity_name)
        return actions.JsonResult(json.dumps(entity_items))
    
    
class ConditionWindowAction(actions.Action):
    '''
    Запрос на получение окна выбора связи
    '''
    url = '/condition-window'
    shortname = 'm3-query-builder-condition'

    def run(self, request, context):
        win = ui.ConditionWindow()
        win.set_conditions( get_conditions() )
        return actions.ExtUIScriptResult(win)
    
    
class ShowQueryTextAction(actions.Action):
    '''
    Возвращает sql текст запроса
    '''
    url = '/sql-query'
    shortname = 'm3-query-builder-sql-query'

    def context_declaration(self):
        return [ACD(name='objects', type=object, required=True)]

    def run(self, request, context):           

        import pprint
        pprint.pprint(context.objects)

        entity = build_entity(context.objects)
        sql = entity.get_raw_sql()
                
        return actions.JsonResult(json.dumps({'sql':sql}))
    

class SaveQueryAction(actions.Action):
    '''
    Сохраняет полученый запрос
    '''
    url = '/save'
    shortname = 'm3-query-builder-save'

    def context_declaration(self):
        return [ACD(name='objects', type=object, required=True),
                ACD(name='query_name', type=str, required=True)]

    def run(self, request, context):           
        
        # Нужно сохранить объект
        try:
            save_query(context.query_name, context.objects)
        except ValidationError:
            logger.exception()
            return actions.JsonResult(json.dumps({'success': False,
                        'message': u'Не удалось сохранить запрос'}))
        
        return actions.JsonResult(json.dumps({'success': True}))