#coding:utf-8 

import json
import uuid

from django.core.exceptions import ValidationError
from django.core.cache import cache

from m3.ui import actions
from m3.ui.actions import ACD, OperationResult
from m3.helpers import logger
from m3.ui.actions.dicts.simple import BaseDictionaryModelActions
from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.fields.complex import ExtDictSelectField
from m3.ui.ext.containers.containers import ExtContainer
from m3.helpers.icons import Icons
from m3.ui.ext.fields.simple import ExtStringField, ExtNumberField, ExtDateField,\
    ExtCheckBox, ExtDisplayField, ExtComboBox

from m3.helpers.datagrouping import GroupingRecordDataProvider

import ui
from models import Query, Report, ReportParams
from api import get_entities, get_entity_items, build_entity, get_conditions, \
    get_aggr_functions, save_query, get_query_params, get_packs, save_report, \
    get_pack, get_report_params, get_report, get_report_data, get_group_fields, \
    get_limit, get_sorted_fields, get_data_classes, get_data_class
        
from entity import Param, SortOrder, Where, EntityException
from m3.ui.ext.misc.store import ExtDataStore

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
        
        window.set_data_to_store_combo_sort([(value, value) for value in SortOrder.VALUES])
        
        if hasattr(context, 'id') and getattr(context, 'id'):
            query = self.parent.model.objects.get(id=context.id)
            
            name = query.name
            query_str = query.query_json

            query_json = json.loads(query_str)

            window.configure_window(
                             id=context.id,
                             name=name,
                             use_dict_result = query.use_dict_result,
                             
                             selected_entities=map(lambda x: [x['id'], 
                                                              x['entityName']], 
                                                   query_json['entities']),
                                    
                             links=map(lambda x: [x['id'],                                                    
                                                  x['outerFirst'],
                                                  x['value'],
                                                  x['outerSecond'],                                                  
                                                  ], query_json['relations']),

                             
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
                                                  x['verboseName'],
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

        entity = build_entity(context.objects)
        try:
            sql = entity.get_raw_sql()
        except EntityException as ins:
            return OperationResult(success=False, message=ins.message)

        win = ui.SqlWindow()
        win.set_source(sql)
        return OperationResult(code=win.get_script())
    

class SaveQueryAction(actions.Action):
    '''
    Сохраняет полученый запрос
    '''
    url = '/save'
    shortname = 'm3-query-builder-save'

    def context_declaration(self):
        return [ACD(name='objects', type=object, required=True, verbose_name=u'Тело запроса'),
                ACD(name='query_name', type=str, required=True, verbose_name=u'Наименование запроса'), 
                ACD(name='id', type=str, required=False, verbose_name=u'Идентификатор запроса'),
                ACD(name='use_dict_result', type=bool, required=True, verbose_name=u'Тип вывода данных')]

    def run(self, request, context):           
        
        query_json = json.dumps(context.objects)

        id = getattr(context, 'id', None)        
        try:
            save_query(id, context.query_name, context.use_dict_result, query_json)
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
                             GetReportFormAction(),
                             GenerateReportAction(),
                             ReportDataAction()])
        
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

                value_name = self.get_values(param.type, param.value) 
                data.append([param.id,
                             param.name,
                             param.verbose_name, 
                             param.type,
                             Param.VALUES[int(param.type)],
                             param.value or '',
                             value_name or '',
                             param.condition
                             ])

            window.astore_params.data = data
        
        return actions.ExtUIScriptResult(data=window)

    def get_values(self, atype, avalue):
        '''
        Возвращает значение и значение выбранного типа
        '''
        value_name = None             
        if atype == Param.DICTIONARY:                    
            pack = get_pack(avalue)
            
            if pack.verbose_name:                        
                assert isinstance(pack.verbose_name, unicode), 'Pack "%s" verbose name must be unicode ' % pack.__class__.__name__
            
            value_name = pack.verbose_name or pack.__class__.__name__
        elif atype == Param.COMBO:                 
            cl = get_data_class(avalue)
            value_name = cl.verbose_name or cl.__class__.__name__

        return value_name

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
                                
        win = ui.ReportParamsWindow(types=Param.get_type_choices(), 
                                    default_type_value=Param.STRING,
                                    params=params)
                
        win.dict_value = Param.DICTIONARY
        win.combo_value = Param.COMBO
               
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
        if context.type == Param.DICTIONARY:   
            data = get_packs()
        if context.type == Param.COMBO:   
            data = get_data_classes()
               
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

        conditions = []

        win = ui.ReportForm()
        win.submit_data_url = GenerateReportAction.absolute_url()
        
        name, params = get_report_params(context.id)
        
        win.title = name
        win.hdn_report_id.value = context.id
        #win.height = 90        
        win.frm_form.layout_config={'align':'stretch'}
        
        multiple_choice = {}
        
        for param in params:

            if param['type'] == Param.STRING:
                field = ExtStringField()
            elif param['type'] == Param.NUMBER:
                field = ExtNumberField()
            elif param['type'] == Param.DATE:
                field = ExtDateField(hide_today_btn=True)
            elif param['type'] == Param.BOOLEAN:
                field = ExtCheckBox()
            elif param['type'] == Param.DICTIONARY:
                # Здесь нужно проверять pack на возможность множественного 
                # выбора и если такой возможен, делать множественный выбор
                
                field = ExtDictSelectField(hide_edit_trigger=True)
                field.pack = param['value']
                 
            elif param['type'] == Param.NUMBER:
                field = ExtNumberField()
            elif param['type'] == Param.COMBO:
                field = ExtComboBox(display_field='text', 
                                    value_field='id',
                                    trigger_action=ExtComboBox.ALL)
                data = get_data_class(param['value']).get_data()                
                field.store = ExtDataStore(data)
            else:
                raise Exception('type "%s" is not define in class TypeField' % param['type'])
                        
            field.anchor = '100%'
            field.label = param['verbose_name']
            field.name = param['name']
            field.enable_key_events = True
            
            cont_outer = ExtContainer(layout='hbox')
            cont_inner = ExtContainer(layout='form', flex=1)
            
            cont_outer.items.append(cont_inner)
            cont_inner.items.append(field)

            if param['type'] in (Param.STRING, Param.NUMBER, Param.DATE, Param.COMBO):
                cont_outer.items.append(ExtButton(handler='function(){ addValue("%s");}' % field.client_id, 
                                                  icon_cls=Icons.ADD,
                                                  client_id='btn-'+field.client_id,
                                                  tooltip_text=u'Условие: %s' % param['condition']))
            
            #win.height += 30
            win.frm_form.items.append(cont_outer)

            multiple_choice[field.client_id] = not (param['condition'] in (Where.LT, Where.LE, Where.GT, Where.GE)) 

            # Добавляются условия:
            conditions.append('%s %s' % (param['verbose_name'] ,param['condition']))
            
        win.multiple_choice = json.dumps(multiple_choice)
        
        info_data_fields = []
        
        report = get_report(context.id)            
        
        json_query = json.loads( report.query.query_json )
        
        # Информация о distinct:
        limit = get_limit(json_query)
        if limit > 0:
            info_data_fields.append(  ExtDisplayField(label=u'<b>Первые</b>', value=limit) )
            
        # Информация о group by:
        gr_fields = get_group_fields(json_query)
        fields = [field_name for entity_name, field_name in gr_fields]
        if fields:
            info_data_fields.append( 
                ExtDisplayField(label=u'<b>Группировка</b>', value='<br/>'.join(fields)) )        
        
        # Информация о сортировке:
        sorted_fields = get_sorted_fields(json_query)
        if sorted_fields:
            info_data_fields.append(        
                ExtDisplayField(label=u'<b>Сортировка</b>', value='<br/>'.join(sorted_fields)) )        
        
        # Информация о where:
        if conditions: 
            info_data_fields.append( 
                ExtDisplayField(label=u'<b>Условия</b>', value='<br/>'.join(conditions)) )
        
        win.frm_info.items.extend(info_data_fields)
        
        return actions.ExtUIScriptResult(win)
       
class GenerateReportAction(actions.Action):
    '''
    Формирует отчет
    '''
    url = '/generate-report'
    shortname = 'm3-report-builder-generate-report'

    TIMEOUT = 30 * 60 # 30 минут

    def context_declaration(self):
        return [ACD(name='params', type=object, required=True, 
                    verbose_name=u'Параметры отчета'),
                ACD(name='id', type=int, required=True, 
                    verbose_name=u'Идентификатор отчета')]
        
    def run(self, request, context):

        report = get_report(context.id)

        entity = build_entity(name=report.query.name,
                              result_type=report.query.use_dict_result,
                               objs=json.loads( report.query.query_json ))

        win = ui.ReportData(params={'data_action': ReportDataAction})        
        win.title = report.name

        for field in entity.get_select_fields():            
            win.grid.add_column(data_index= field.get_full_field_name(), 
                                header=field.verbose_name or field.field_name,
                                # Группировка
                                extra={'groupable': True},
                                #Сортировка
                                sortable = True)                
        
        # Кеширование данных
        data = get_report_data(report, context.params)        
        
        cache.set(win.client_id, data, GenerateReportAction.TIMEOUT)
            
        return actions.ExtUIScriptResult(win)


class ReportDataAction(actions.Action):
    '''
    Отдает данные для отчета
    '''
    
    url = '/report-data'
    
    shortname = 'm3-report-builder-report-data'
    
    def context_declaration(self):
        return [ACD(name='m3_window_id', type=str, required=True, 
                    verbose_name=u'Идентификатор формы'),
                ACD(name='limit', type=int, required=True, 
                    verbose_name=u'Количество записей'),
                ACD(name='start', type=int, required=True, 
                    verbose_name=u'Индекс записи'),
                
                # Группировка
                ACD(name='exp', type=object, required=True, 
                    verbose_name=u'Развернутые строки'),
                ACD(name='grouped', type=object, required=True, 
                    verbose_name=u'Сгруппированные столбцы'),
                
                # Сортировка
                ACD(name='sort', type=str, required=False, 
                    verbose_name=u'Сортируемый столбец'),
                ACD(name='dir', type=str, required=False, 
                    verbose_name=u'Направление сортировки'),]
        
    def run(self, request, context):
        # Ответ из кеша
        data = cache.get(context.m3_window_id)

        sorting = {}
        if hasattr(context, 'sort') and context.sort:
            sorting[context.sort] = context.dir
        
        report = get_report(context.id)
        query = report.query
        entity = build_entity(name=query.name, 
                              result_type=query.use_dict_result,
                              objs=json.loads( report.query.query_json ))    

        # Генерируется словарь, коючем является название поля со значением
        # None по умолчанию
        proxy = dict((field.get_full_field_name(), None) 
                          for field in entity.get_select_fields())

        
        prov = GroupingRecordDataProvider(proxy = proxy, data=data)               

        list, total = prov.get_elements(context.start, 
                                        context.start + context.limit,
                                        context.grouped, 
                                        context.exp, 
                                        sorting)
                        
        return actions.PreJsonResult({'rows': list, 
                                      'total': total
                                      })