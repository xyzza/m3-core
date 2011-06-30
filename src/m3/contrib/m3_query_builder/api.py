#coding: utf-8

'''
Created on 06.06.2011

@author: prefer
'''
import json

from django.db import transaction

from m3.ui.ext.containers.trees import ExtTreeNode
from m3.contrib.m3_query_builder import EntityCache
from m3.helpers.icons import Icons
from m3.ui.actions import ControllerCache

from entity import BaseEntity, Field, Entity, Relation, Grouping, Where
from models import Query, Report, ReportParams

def get_entities():
    '''
    Получение всех имеющихся схем и возвращение их как узлов в дереве
    '''
    
    entities = EntityCache.get_entities()
    res = []
    for entity in entities:
        
        assert issubclass(entity, BaseEntity)
        
        # Через ExtTreeNode
        node = ExtTreeNode(client_id=entity.__name__, 
                           auto_check=True, 
                           icon_cls=Icons.PLUGIN)        
        node.set_items(schemes=entity.name)

        res.append(node)
        
    return map(lambda item: item.render(), res)

def get_entity_items(entities):
    '''
    Возвращает список полей для схемы как узел дерева и список полей как дочерние
    узлы
    '''
    res = []
    for entity_name in entities:
        entity = EntityCache.get_entity(entity_name)
        if entity:
            fields = entity.get_select_fields()
            
            # Через словарики - это выявило одну проблему:
            # TODO: Немного неудобно работать с ExtTreeNode, т.к. нужно
            # учить json.dumps работать с этим объектом
            root_node = {
                    'id': entity.__name__, 
                    'leaf': False,
                    'iconCls': Icons.PLUGIN,
                    'verbose_field': entity.name,                           
                    'expanded': True}
    
            for field in fields:
                
                assert isinstance(field, Field)
    
                node = {'leaf': True,
                        'verbose_field': field.verbose_name or field.alias or field.field_name,
                        'id_field': field.alias or field.field_name,
                        'entity_name': entity_name}
                
                root_node.setdefault('children', []).append(node)
                
            res.append(root_node)
            
    return res


def build_entity(objs, separator='-'):    
    '''
    Создает объект сущности по данным формы редактора запроса
    '''
    entity = BaseEntity()
    
    # Используемые сущности
        
    entity.entities = map(lambda x: Entity(x), objs['entities'])
    
    # Список связей    
    entity.relations = [             
        Relation(
            Field(Entity(rel['entityFirst']), rel['entityFirstField']),     
            Field(Entity(rel['entitySecond']), rel['entitySecondField']),
            outer_first=rel['outerFirst'],            
            outer_second=rel['outerSecond'],
        ) for rel in objs['relations']]
    
    # Список группировки
    group_fields = []
    for group_field in objs['group']['group_fields']:
        entity_name, field_name = group_field['id'].split(separator)
        field = Field(entity=Entity(entity_name),
                      field_name=field_name,)
        
    aggr_fields = []
    for group_field in objs['group']['group_aggr_fields']:
        entity_name, field_name = group_field['id'].split(separator)
        field = Field(entity=Entity(entity_name),
                      field_name=field_name,)
        
        # Получение класса для агригирования. Например: Min, Max, Count
        aggr_func = group_field.get('function')
        if aggr_func:
            aggr_class = get_aggr_functions()[aggr_func]
            
            aggr_fields.append(aggr_class(field))
    
    entity.group_by = Grouping(group_fields=group_fields, 
                               aggregate_fields=aggr_fields)
    
    # Список полей выборки
    for select_field in objs['selected_fields']:
        
        entity_name, field_name = select_field['id'].split(separator)

        field = Field(entity=Entity(entity_name),
                      field_name=field_name, 
                      alias=select_field.get('alias'))
        
        entity.select.append(field)
            
    # Список условий    
    entity.where = Where()
    for condition in objs['cond_fields']:
        
        entity_name, field_name = condition['id'].split(separator)
                
        field = Field(entity=Entity(entity_name),
                      field_name=field_name)
                
        entity.where &= Where(left=field, op=condition['condition'], 
                  right=condition['parameter'])                
      
      
    entity.distinct = objs['distinct']
    
    if objs['limit']:
        entity.limit = objs['limit']
    
    return entity

def get_aggr_functions():
    '''
    Возвращает возможные функции для агригирования
    '''
    return Grouping.get_aggr_functions()
    
    
def get_conditions():
    '''
    Возвращает возможные условия
    '''
    return Where.get_simple_conditions()

def save_query(id, query_name, query_json):
    '''
    Сохранение запросов
    '''
    if id:
        q = Query.objects.get(id=id)
        q.name = query_name
        q.query_json = query_json
    else:
        q = Query(name=query_name, query_json=query_json)
    
    q.full_clean()
    q.save()
    
def get_query_params(query_id):
    '''
    Возвращает параметры запроса
    @param query_id: Идентификатор запроса
    '''
    query = Query.objects.get(id=query_id)
    query_json = json.loads(query.query_json)
    
    res = []
    for condition in query_json['cond_fields']:        
        
        # Множественный выбор или нет, то есть используется ли 
        # оператор IN или нет                        
        res.append({'name': condition['parameter'], 
                    'multiple_choice': condition['condition'] == Where.IN})
        
    return res

def get_report_params(report_id):
    '''
    Возвращает параметры отчета
    '''
    report = ReportParams.objects.filter(report_id__in=report_id)

def get_packs():
    '''
    Возвращает все паки в проекте
    '''
    res = []
    controllers = ControllerCache.get_controllers()
    for cont in controllers:
        res.extend([ [pack.__class__.__name__, 
                      pack.verbose_name or pack.__class__.__name__] \
                    for pack in cont.get_packs()])
    return sorted(res)

def get_pack(pack_name):
    '''
    Возвращает пак по имени
    '''
    return ControllerCache.find_pack(pack_name)

@transaction.commit_on_success()
def save_report(id, name, query_id, grid_data):
    '''
    Сохраняет отчет
    '''
    
    if id:
        q = Report.objects.get(id=id)
        q.name = name
        q.query_id = query_id
    else:
        q = Report(name=name, query_id=query_id)
        
    q.save()
    
    ReportParams.objects.filter(report=q).delete()
    for item in grid_data:
        report_params = ReportParams()
        report_params.report_id = q.id
        report_params.verbose_name = item['verbose_name']
        report_params.name = item['name']
        report_params.type = item['type']
        
        if item.get('type_value'):
            report_params.value = item['type_value']
                
        report_params.save()
    