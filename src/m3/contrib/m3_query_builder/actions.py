#coding:utf-8 

import json

from django.core.exceptions import ValidationError

from m3.ui import actions
from m3.ui.actions import ACD
from m3.helpers import logger
from m3.ui.actions.dicts.simple import BaseDictionaryModelActions

import ui
from api import get_entities, get_entity_items, build_entity, get_conditions, \
    get_aggr_functions, save_query

from models import Query


class QueryBuilderActionsPack(BaseDictionaryModelActions):
    '''
    Экшенпак работы с конструктором запросов
    '''
    url = '/qb-pack'
    
    shortname = 'm3-query-builder-main-actions'
    
    model = Query

    title = u'Запросы'

    edit_window = ui.QueryBuilderWindow

    list_columns = [('name', u'Наименование')]

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
    url = '/edit-window'
    shortname = 'm3-query-builder-edit-window'

    def context_declaration(self):
        return [ACD(name='id', type=int, required=False, 
                        verbose_name=u'Идентификатор запроса')]

    def run(self, request, context):
        params = {'select_connections_url': SelectConnectionWindowAction.absolute_url(),
                  'entity_items_url': EntitiyItemsListAction.absolute_url(),
                  'condition_url': ConditionWindowAction.absolute_url(),
                  'query_text_url': ShowQueryTextAction.absolute_url(),
                  'save_query_url': SaveQueryAction.absolute_url()}
        window = ui.QueryBuilderWindow(params=params)
        window.set_aggr_functions( get_aggr_functions())
        
        
        if hasattr(context, 'id') and getattr(context, 'id'):
            query = self.parent.model.objects.get(id=context.id)
            
            name = query.name
            query_str = query.query_json

            query_json = json.loads(query_str)
            entity = build_entity( query_json )
            
            import pprint
            pprint.pprint(query_json)
            
            window.configure_window(id=context.id,
                             name=name,
                             
                             selected_entities=map(lambda x: [x['entityName'], x['entityName']], query_json['entities']),
                             links=[],
                             
                             distinct=entity.distinct,
                             limit=entity.limit,
                             selected_fields=[],
                             
                             group_fields=[],
                             aggr_fields=[],
                             
                             conditions=[])        
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
                ACD(name='query_name', type=str, required=True), 
                ACD(name='id', type=str, required=False),]

    def run(self, request, context):           
        
        query_json = json.dumps(context.objects)
        
        import pprint        
        pprint.pprint(query_json)
        
        id = getattr(context, 'id', None)        
        try:
            save_query(id, context.query_name, query_json)
        except ValidationError:
            logger.exception()
            return actions.JsonResult(json.dumps({'success': False,
                        'message': u'Не удалось сохранить запрос'}))
        
        return actions.JsonResult(json.dumps({'success': True}))