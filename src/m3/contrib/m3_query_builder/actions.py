#coding:utf-8 

import json
import uuid

from django.core.exceptions import ValidationError

from m3.ui import actions
from m3.ui.actions import ACD
from m3.helpers import logger
from m3.ui.actions.dicts.simple import BaseDictionaryModelActions
from m3.ui.ext.controls.buttons import ExtButton

import ui
from api import get_entities, get_entity_items, build_entity, get_conditions, \
    get_aggr_functions, save_query, get_query_params, get_packs, save_report, \
    get_pack

from models import Query, Report, TypeField
from models import ReportParams




class QueryBuilderActionsPack(BaseDictionaryModelActions):
    '''
    Экшенпак работы с конструктором запросов
    '''
    url = '/qb-pack'    
    shortname = 'm3-query-builder'    
    model = Query
    title = u'Запросы'
    edit_window = ui.QueryBuilderWindow
    list_columns = [('name', u'Наименование')]
    
    verbose_name = u'Конструктор запросов'

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

            window.configure_window(
                             id=context.id,
                             name=name,
                             
                             selected_entities=map(lambda x: [x['id'], 
                                                              x['entityName']], 
                                                   query_json['entities']),
                                    
                             links=map(lambda x: [ str(uuid.uuid4())[:8],# ID
                                                  x['entityFirst'],
                                                  x['entityFirstField'],  
                                                  x['outerFirst'],
                                                  
                                                  x['entitySecond'],                                                    
                                                  x['entitySecondField'],                                                                                                   
                                                  x['outerSecond'],
                                                  
                                                  x['value'],], query_json['relations']),

                             
                             distinct=query_json['distinct'],
                             limit=query_json['limit'],
                             
                             selected_fields=map(lambda x: [ 
                                                  x['id'],
                                                  x['fieldName'],  
                                                  x.get('alias') or '',                                                  
                                                  x.get('sorting') or '',                                                                                                      
                                                  ], query_json['selected_fields']),
                             
                             group_fields=map(lambda x: [ 
                                                  x['id'],
                                                  x['fieldName'],                                                                                                        
                                                  ], query_json['group']['group_fields']),
                             aggr_fields=map(lambda x: [ 
                                                  x['id'],
                                                  x['fieldName'],
                                                  x.get('function') or '',
                                                  ], query_json['group']['group_aggr_fields']),
                             
                             conditions=map(lambda x: [ 
                                                  x['id'],
                                                  x['fieldName'],
                                                  x['condition'],
                                                  x['parameter'],
                                                  x['expression']
                                                  ], query_json['cond_fields']),)        
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
        return [ACD(name='entities', type=object, required=True)]

    def run(self, request, context):           
        entity_items = get_entity_items(context.entities)
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

        id = getattr(context, 'id', None)        
        try:
            save_query(id, context.query_name, query_json)
        except ValidationError:
            logger.exception()
            return actions.JsonResult(json.dumps({'success': False,
                        'message': u'Не удалось сохранить запрос'}))
        
        return actions.JsonResult(json.dumps({'success': True}))
    
    
    
#===============================================================================
class ReportBuilderActionsPack(BaseDictionaryModelActions):
    '''
    Экшенпак работы с конструктором отчетов
    '''
    url = '/rb-pack'    
    shortname = 'm3-report-builder'    
    model = Report
    title = u'Отчеты'
    list_columns = [('name', u'Наименование')]
    
    verbose_name = u'Конструктор отчетов'

    def __init__(self):
        super(ReportBuilderActionsPack, self).__init__()        
        self.actions.extend([ReportBuilderWindowAction(),
                             ReportQueryParamsAction(), 
                             ReportQuerySaveAction(),
                             ReportEditParamsWindowAction(),
                             GetPacksProjectAction(),
                             GetReportFormAction()])
        
    def get_list_window(self, win):
        win.template_globals = 'rb-report-list.js'
        win.report_form_url = GetReportFormAction.absolute_url()      
        win.buttons.insert(0, ExtButton(text=u'Показать форму отчета',
                                        handler='openReportForm'
                                        ))
        return win
    
class ReportBuilderWindowAction(actions.Action):
    '''
    Запрос на получение окна конструктора отчетов
    '''
    url = '/edit-window'
    shortname = 'm3-report-builder-edit-window'

    def context_declaration(self):
        return [ACD(name='id', type=int, required=False, verbose_name=u'Идентификатор запроса')]

    def run(self, request, context):
        
        id = getattr(context, 'id', None)
        
        params = {'query_params_url': ReportQueryParamsAction.absolute_url(),
                  'edit_window_params_url': ReportEditParamsWindowAction.absolute_url(),                 
                  }
        window = ui.ReportBuilderWindow(params=params)
        window.dsf_query.pack = QueryBuilderActionsPack
        if id:
            report = Report.objects.get(id=id)
            
            window.form.from_object(report)
            
            data = []
            for param in ReportParams.objects.filter(report=id):

                value, value_name = None, None                
                if param.type == TypeField.DICTIONARY_FIELD:
                    value = param.value                    
                    pack = get_pack(value)
                    
                    if pack.verbose_name:                        
                        assert isinstance(pack.verbose_name, unicode), 'Pack "%s" verbose name must be unicode ' % pack.__class__.__name__
                    
                    value_name = pack.verbose_name or pack.__class__.__name__

                       
                data.append([param.id,
                             param.name,
                             param.verbose_name, 
                             param.type,
                             TypeField.VALUES[int(param.type)],
                             value or '',
                             value_name or ''
                             ])

            window.astore_params.data = data
        
        return actions.ExtUIScriptResult(data=window)

class ReportQueryParamsAction(actions.Action):
    '''
    Получение параметров для отчета у связанного запроса
    '''
    url = '/params'
    shortname = 'm3-report-builder-query-params'
    
    def context_declaration(self):
        return [ACD(name='query_id', type=int, required=True, verbose_name=u'Идентификатор запроса')]

    def run(self, request, context):
        params = get_query_params(context.query_id)
        return actions.JsonResult(json.dumps(params))

class ReportQuerySaveAction(actions.Action):
    '''
    Сохранение отчета
    '''
    url = '/save'
    shortname = 'm3-report-builder-query-save'

    def context_declaration(self):
        return [ACD(name='id', type=int, required=False, verbose_name=u'Идентификатор отчета'),
                ACD(name='name', type=str, required=True, verbose_name=u'Наименование отчета'),
                ACD(name='query_id', type=int, required=True, verbose_name=u'Идентификатор запроса'),
                ACD(name='grid', type=object, required=True, verbose_name=u'Данные таблицы'),]

    def run(self, request, context):
        id = getattr(context, 'id', None)
        
        try:
            save_report(id, context.name, context.query_id, context.grid)
        except ValidationError:
            logger.exception()
            return actions.JsonResult(json.dumps({'success': False,
                        'message': u'Не удалось сохранить запрос'}))
            
        return actions.JsonResult(json.dumps({'success':True}))
    
    
class ReportEditParamsWindowAction(actions.Action):
    '''
    Запрос на получение окна редактрирования параметров
    '''
    url = '/edit-window-params'
    shortname = 'm3-report-builder-edit-window-params'

    def context_declaration(self):
        return [ACD(name='id', type=str, required=True, verbose_name=u'Идентификатор параметра'),]

    def run(self, request, context):
        params = {
                  'get_packs_url': GetPacksProjectAction.absolute_url(),
                  }
                                
        win = ui.ReportParamsWindow(types=TypeField.get_type_choices(), 
                                    default_type_value=TypeField.STRING_FIELD,
                                    params=params)
                
        win.dict_value = TypeField.DICTIONARY_FIELD
               
        return actions.ExtUIScriptResult(win)
    
class GetPacksProjectAction(actions.Action):
    '''
    Возвращает все паки в проекте
    '''
    url = '/get-packs-project'
    shortname = 'm3-report-builder-get-packs-project'
    
    def context_declaration(self):
        return [ACD(name='type', type=int, required=True, 
                    verbose_name=u'Идентификатор типа параметра'),]

    def run(self, request, context):
        data = None
        if context.type == TypeField.DICTIONARY_FIELD:           
            data = get_packs()
               
        return actions.JsonResult(json.dumps({'success': True, 'data': data}))
    
class GetReportFormAction(actions.Action):
    '''
    Возвращает форму отчета
    '''
    url = '/report-form'
    shortname = 'm3-report-builder-report-from'

    def context_declaration(self):
        return [ACD(name='id', type=str, required=True, 
                    verbose_name=u'Идентификатор отчета'),]

    def run(self, request, context):
        
        context.id
        
        win = ui.ReportForm()
        return actions.ExtUIScriptResult(win)