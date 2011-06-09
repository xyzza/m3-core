#coding: utf-8

'''
Created on 06.06.2011

@author: prefer
'''
from m3.ui.ext.containers.trees import ExtTreeNode
from m3.contrib.m3_query_builder import EntityCache
from m3.helpers.icons import Icons

from entity import BaseEntity, Field


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
                'fields_entities': entity.name,                           
                'expanded': True}

        for field in fields:
            
            assert isinstance(field, Field)

            node = {'leaf': True,
                    'fields_entities': field.verbose_name or field.alias or field.name,
                    'entity_name': entity_name}
            
            root_node.setdefault('children', []).append(node)
            
        res.append(root_node)
    
    print res
    return res
