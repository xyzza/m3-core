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