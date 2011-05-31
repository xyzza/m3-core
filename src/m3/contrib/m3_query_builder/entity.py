#coding: utf-8
'''
Created on 26.05.2011

@author: prefer
'''
from m3.helpers.datastructures import TypedList


class Relation(object):
    '''
    Связь между сущностями
    '''
    def __init__(self, entity_first, key_first, entity_second, key_second):
        '''
        @param table_first: Первая сущность
        @param key_first: Первый ключ для связи
        @param entity_second: Вторая сущность
        @param key_second: Второй ключ для связи 
        '''
        self.table_first = entity_first
        self.key_first = key_first
        
        self.table_second = entity_second
        self.key_second = key_second
        

class Table(object):
    '''
    Для обозначения таблиц в схемах
    '''        
    pass


class Model(object):
    '''
    Для обозначения моделей в схемах
    '''
    pass


class Entity(object):
    '''
    Для обозначения сущности в схемах
    '''
    pass


class Field(object):
    '''
    Для обозначения поля
    '''
    ALL_FIELDS = '*'
    
    pass

        
class BaseEntity(object):
    '''
    Базовый класс для сущностей/схемы/прокси/view - кому как удобно
    В дальнейшем будем употреблять "сущность"
    ps: view в контексте бд
    '''
    
    # Имя сущности
    name = None
    
    # Список объектов (модели, сущности, имена таблиц), используемых во текущей
    # сущности. Если нужны алиасы, то их необходимо использовать здесь в виде: 
    # entities = [{'m1':'MyModel1'}, {'m2':'MyModel2'}, MyModel1'] 
    # m1 - алиас модели MyModel1
    entities = []
    
    # Типизированный список связей, над вышеупомянутами объектами
    relations = TypedList(type=Relation)
    
    # Список полей, по которым нужно проводить группировку
    group_by = []
    
    # Объект условий
    where = None
    
    # Словарь с алиасами для полей в select'e запроса
    select = {}
    
    # Выводить повторяющиеся записи?
    distinct = None
    
    # Количество показываемых записей
    limit = None
