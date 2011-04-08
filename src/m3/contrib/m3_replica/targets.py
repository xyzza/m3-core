#coding:utf-8
'''
Модуль с описанием возможных 

Created on 13.03.2011

@author: akvarats
'''

from m3.contrib.m3_contragents import Contragent

from django.db import models  

from engine import (BaseDataTarget,
                    ReplicatedObjectsPackage,)


class ModelDataTarget(BaseDataTarget):
    '''
    Получатель данных, который занимается сохранением информации
    в модели приложения.
    
    Принимает к сохренению следующие типы объектов:
    * просто модель;
    * список моделей;
    * список моделей, упакованный в объект типа ReplicatedObjectsPackage
    '''    
    def __init__(self):
        super(ModelDataTarget, self).__init__()
        
    def write(self, objects):
        '''
        Выполняет сохранение переданных(-ой) моделей(-и) в базу данных.
        
        @param objects: список (list) либо экземпляр класса, реализующего
                        метод save()
        
        Особенности:
        * управление транзакциями происходит на уровне управляющего 
          DataExchange;
        '''
        
        if isinstance(objects, list):
            for obj in objects:
                obj.save()
        elif isinstance(objects, ReplicatedObjectsPackage):
            for obj in objects.get_objects():
                obj.save()
        else:
            # тупо пытаемся вызвать метод save()
            # если такого метода нет, то извиняйте ребята,
            # нечего всякую хрень сюда совать
            objects.save()
            
        return objects

class ContragentModelDataTarget(ModelDataTarget):
    '''
    Приемник данных, который записывает информацию в слой хранения моделей
    парой ОбъектСсылающийсяНаКонтрагента 
    '''
    def __init__(self, contragent_field_map={}):
        '''
        @param contragent_field_map: словарь соответствия моделей и имен
            полей, ссылающиеся на контрагентов.
            
        В случае если contragent_field_map не указан, то по умолчанию, считается,
        что ссылочное поле назвается contragent.
        '''
        super(ContragentModelDataTarget, self).__init__()
        self.contragent_field_map = contragent_field_map or {}
        
    def write(self, objects):
        '''
        Фактически выполняет роль предобработки перед базовым методом записи 
        экземпляров моделей в базу данных.
        
        В ходе этой предобработки из пакета объектов выбирается запись
        '''
        proxy_list = [] # промежуточный список объектов, подлежащих сохранению
                        # нужен для того, чтобы обрабатывать ситуацию, когда
                        # на запись передан всего один объект
        if isinstance(objects, list):
            proxy_list.extend(objects)
        elif isinstance(objects, ReplicatedObjectsPackage):
            proxy_list.extend(objects.get_objects())
        
        # тот самый контрагент, для которого выполняется
        # сохранение пакета данных
        contragent = None 
        
        # выделяем из массива переданных объектов того самого контрагента
        # по условиям игры, такой объект должен быть один, поэтому берем
        # только первый попавшийся.
        if proxy_list:
            for obj in objects:
                if isinstance(obj, Contragent):
                    contragent = obj
                    break
                
        # в случае, если контрагента в массиве данных мы не нашли, то
        # действуем так, как будто бы ничего не произошло
        if proxy_list and contragent:
            # TODO: да, объект контрагента сохранится дважды, 
            # надо как-то исключать его из objects чтоле..
            # тупо remove нельзя, потому что сохраненные
            # объекты передаются по конвейеру обработки дальше
            contragent.save()
            for obj in proxy_list:
                if obj != contragent: 
                    setattr(obj, self.contragent_field_map.get(obj.__class__, 'contragent'), contragent)
        
        return super(ContragentModelDataTarget, self).write(objects)


class ReferenceModelTarget(ModelDataTarget):
    """
    Приемник данных, способный принять в себя неограниченное количество каскадно связанных объектов.
    В качестве идентификатора связывания принимается параметр словарь field_map. Связи рассматриваются в виде one-to-one и
    one-to-many (в последнем случае дочерние объекты представлены в виде списка).
    """
    def __init__(self, field_map):
        """
        @param field_map: вложенный словарь, передающий взаимосвязи связываемых объектов. Обязательный параметр, 
        по которому проводится каскадное сохранение объектов. Ключем словаря является кортеж, содержащий пару значений: 
        название класса и название атрибута модели, которое для данной подчиненной модели служит внешним ключом 
        (для самой главной модели параметр отсутствует). В качестве значения элемента словаря служит другой словарь с 
        аналогичными главному словарю свойствами. Сами объекты поступают в метод write обычным линейным списком (каждый
        объект внутри списка может быть представлен списком однотипных объектов).
        Пример field_map: {("Contragent", None):{("Provider", "ctr_agent"):{("Ent", "provider"):{}},},}
        """
        super(ReferenceModelTarget, self).__init__()
        self.field_map = field_map or {}
    
    def customize_objects(self, objects):
        """
        метод, переформирующий список целевых объектов для быстрого доступа
        """
        result = {}
        for object in objects:
            if isinstance(object, list): #если список объектов
                result[object[0].__class__] = object #то берем название класса первого в списке
            else:
                result[object.__class__.__name__] = object
        return result
    
    def walk_field_map(self, node, objects, master=None):
        """
        рекурсивный обход карты связей моделей и сохранение целевых объектов
        """
        for model, relations in node.iteritems():
            #ищем текущую модель model[0]
            if objects.has_key(model[0]):
                current_objects = objects[model[0]]
            else:
                continue
            #проверяем, является ли текущий объект списком объектов
            if not isinstance(current_objects, list):
                current_objects = [current_objects]

            #сохраняем все текущие объекты в цикле 
            for current_object in current_objects:
                #если указана вышестоящая модель, связываем с текущей моделью прежде чем сохранить ее
                if master and len(model) > 0 and model[1]:
                    parent_field = model[1]
                    setattr(current_object, parent_field, master)
                #сохраняем текущую модель
                current_object.save()

            if len(current_objects) < 1:
                #чтобы не допустить дальнешнего сохранения после пробежки по пустому списку
                continue
            #как главный объект для дальнейшего каскадного сохранения берем первый текущий объект 
            self.walk_field_map(node=relations, objects=objects, master=current_objects[0])

    def write(self, objects):
        """
        Производит каскадное сохранение всех объектов.
        Объекты передаются одиночно.
        """
        objects = self.customize_objects(objects)
        #рекурсивно пробегаемся по карте связей
        self.walk_field_map(node=self.field_map, objects=objects)
        #return objects
            