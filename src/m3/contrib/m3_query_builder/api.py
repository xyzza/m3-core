#coding: utf-8

'''
Created on 06.06.2011

@author: prefer
'''
from m3.ui.ext.containers.trees import ExtTreeNode
from m3.contrib.m3_query_builder import EntityCache
from m3.helpers.icons import Icons

from entity import BaseEntity, Field, Entity, Relation, Grouping, Where

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

def get_entity_items(entity_name):
    '''
    Возвращает список полей для схемы как узел дерева и список полей как дочерние
    узлы
    '''
    res = []
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
                    'verbose_field': field.verbose_name or field.alias or field.name,
                    'id_field': field.alias or field.name,
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
            Field(rel['entityFirst'], rel['entityFirstField']),     
            Field(rel['entitySecond'], rel['entitySecondField']),
            outer_first=rel['outerFirst'],            
            outer_second=rel['outerSecond'],
        ) for rel in objs['relations']]
    
    # Список группировки
    entity.group_by = []
    
    # Список полей выборки
    for select_field in objs['selected_fields']:
        
        entity_name, field_name = select_field['id'].split(separator)
        
        field = Field(entity_name = entity_name,
                      field_name=field_name, 
                      alias=select_field.get('alias'))
        
        entity.select.append(field)
            
    # Список условий    
    entity.where = Where()
    for condition in objs['cond_fields']:
        
        entity_name, field_name = condition['id'].split(separator)
        
        entity_and_field = '%s.%s' % (entity_name, field_name) 
                
        entity.where &= Where(left=entity_and_field, op=condition['condition'], 
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