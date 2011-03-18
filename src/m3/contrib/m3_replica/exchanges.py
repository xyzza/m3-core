#coding:utf-8
'''
Created on 03.03.2011

@author: akvarats
'''

from django.db import models
from django.utils.encoding import force_unicode

from m3.contrib.m3_contragents import Contragent

from engine import (BaseDataExchange,
                    ModelReplicationStorage,
                    ReplicatedObjectsPackage,)

from targets import (ModelDataTarget,
                     ContragentModelDataTarget,)

from api import register_imported_model

class SimpleModelImport(BaseDataExchange):
    '''
    Класс обмена данными, который реализует механизм импорта данных простых
    линейных моделей
    '''
    
    def __init__(self, model, data_source, field_map, ekey_index, 
                 target=ModelDataTarget(),
                 replica_storage=None, replica_map={}):
        '''
        Инициализирует механизм синхронизации простых моделей.
        
        @param model: модель, которая используется для хранения полей. 
                      Класс модели должен допускать безопасное создание
                      экземпляра дефолтного "конструктора" (короче, будет
                      вызываться smthng = self.model()
        @param data_source: источник данных, используемый для получения 
                            внешних данных. 
        @param field_map: описание соответствия полей источника данных и модели.
        @param ekey_index: индекс внешнего ключа в порции данных, которая приходит 
                           из источника данных.
        @param replica_map: словарь, который определяет отдельные обработчики
                            получения реплик для связанных объектов.
        
        Значение карты соответствия полей задается с помощью значения словаря, 
        значениями которого являются индекс (значение ключа) в строке источника данных,
        а ключами - названия полей в моделях.
        
        В случае если источник данных возвращает кортеж или список (как например,
        для DjangoSQLDataSource), то словарь должен иметь в качестве ключей
        индексы полей в строке-кортеже. Например, {'code':0,'name':1,}.
        
        replica_map представляет собой словарь, ключами которого являются
        классы моделей, для которых указывается собственная процедура получения
        реплик. значениями словаря должны быть callable-объекты, которым при 
        вызове переданы тип модели, значение внешнего ключа и используемый при
        обработке объект ReplicationStorage. 
        '''
        
        self.model = model
        self.field_map = field_map or {}
        self.ekey_index = ekey_index or 0
        self.replica_map = replica_map or {}
        super(SimpleModelImport, self).__init__(source=data_source,
                                                target=target or ModelDataTarget(),
                                                replica_storage=replica_storage or ModelReplicationStorage())
    
    def _get_replicated_object(self, model, external_key):
        '''
        Метод, который достает связанные объекты из базы данных на основе 
        ранее реплицированных объектов.
        
        Метод можно переопределять в дочерних классах.
        '''
        result = None
        if self.replica_map.has_key(model):
            result = self.replica_map[model](model, external_key, self.replica_storage)
        else:
            result = self.replica_storage.get_replica(external_key, model)

        return result
    
    def _get_ekey(self, source_row):
        '''
        Получение значения внешнего ключа по переданной порции 
        данных из источника данных
        '''
        return force_unicode(source_row[self.ekey_index])
    
    
    def _convert_value(self, field, external_value):
        '''
        Основной метод преобразования значения из 
        '''
        
        result = None
        
        # константы для групповой обработки типов полей
        RELATED_FIELDS  = [models.ForeignKey, models.OneToOneField,]
        STRING_FIELDS   = [models.CharField, models.TextField,]
        INTEGER_FIELDS  = [models.IntegerField, models.PositiveIntegerField,
                           models.SmallIntegerField, models.PositiveSmallIntegerField,
                           models.BigIntegerField, models.AutoField,]
        FLOAT_FIELDS    = [models.FloatField, models.DecimalField,]
        DATE_FIELDS     = [models.DateField,]
        DATETIME_FIELDS = [models.DateTimeField,]
        BOOLEAN_FIELDS  = [models.BooleanField,]
        
        # если поле является ссылочным, то пытаемся достать
        # ссылочную модель
        field_cls = field.__class__ 
        if field_cls in RELATED_FIELDS:
            result = self._get_related_object(field.rel.to, external_value)
            
        elif field_cls in STRING_FIELDS:
            if external_value:
                result = force_unicode(external_value)
            else:
                result = ''
            
        elif field_cls in INTEGER_FIELDS:
            result = int(external_value)
            
        elif field_cls in FLOAT_FIELDS:
            result = float(field_cls)
            
        elif (field_cls in DATE_FIELDS or
              field_cls in DATETIME_FIELDS):
            # вроде как джанговские бэкэнды читают дату и время корректно
            result = external_value 
        elif field_cls in BOOLEAN_FIELDS:
            result = bool(external_value) 
        else:
            result = external_value
            
        return result
        
        
    def handle(self, source_row):
        '''
        Основная процедура импорта обычных моделей
        '''
        # пытаемся понять, реплицировали ли мы данный объект ранее
        obj = self._get_replicated_object(self.model, self._get_ekey(source_row))
        if not obj:
            # если не реплицировали, то создаем новую модель
            obj = self.model()
        
        for field in self.model._meta.fields:
            if self.field_map.has_key(field.name):
                value = self._convert_value(field, source_row[self.field_map[field.name]])
                setattr(obj, field.name, value)
        
        return obj
    
    def post_write(self, source_row, written_objects):
        '''
        Добавляем регистрацию записанной в приемник данных модели с целью
        запоминания соответствия внутреннего и внешних ключей
        '''
        
        if source_row and written_objects:
            if isinstance(written_objects, ReplicatedObjectsPackage):
                for obj, external_key in written_objects.iter_objects():
                    register_imported_model(obj, external_key)
            else: 
                # значение внешнего ключа
                ekey = self._get_ekey(source_row)
                if ekey:
                    if isinstance(written_objects, list):
                        for obj in written_objects:
                            register_imported_model(obj, ekey)                
                
class ContragentModelImport(SimpleModelImport):
    '''
    Класс, который отвечает за загрузку моделей, которые имеют ссылки на 
    таблицы контрагентов. Загрузка таких моделей требует определенных
    телодвижений с целью сохранения не только самих бизнес-сущностей,
    но и связанных с ними записями моделей контрагентов
    '''
    # TODO: на данный момент класс позволяет загружать только юридические
    # лица. Необходимо его доработать для того, чтобы происходило
    # автоматическое определение типа контрагента и его корректное сохранение. 
    
    def __init__(self, model, data_source, field_map, contragent_field_map,
                 ekey_index=0, replica_storage=None, replica_map={},
                 contragent_field = 'contragent',):
        '''
        В дополнение к конструктору базового класса добавляется словарь 
        соответствия прочитанных значений из источника данных в модели 
        контрагента (contragent_field_map).
        
        Также, необходимо указать, как в бизнес-модели назвается поле-ссылка
        на контрагента.
        '''
        super(ContragentModelImport, self).__init__(model=model,
                                                    data_source=data_source,
                                                    target=ContragentModelDataTarget(),
                                                    field_map=field_map,
                                                    ekey_index=ekey_index,
                                                    replica_storage=replica_storage,
                                                    replica_map=replica_map)
        
        self.contragent_field_map = contragent_field_map
        self.contragent_field = 'contragent'  
        
    def handle(self, source_row):
        '''
        Модифицируем поведение при преобразовании данных с целью
        '''
        # сначала обрабатываем стооку из источника данных по стандартной схеме.
        obj = super(ContragentModelImport, self).handle(source_row)
        contragent = None
        if not obj.id:
            # объект загружается впервые, и мы должны создать для него
            # запись в контрагентах
            contragent = Contragent()
        else:
            # пытаемся достать значение из текущего импортируемого объекта
            
            # TODO: здесь будет много запросов в базу данных вследствие
            # ленивой загрузки данных. для оптимизации в дальнейшем необходимо
            # будет использовать кеши из ReplicationStorage  
            contragent = getattr(obj, self.contragent_field, None)
             
        if contragent:
            # заполняем объект контрагента согласно строки
            for field in Contragent._meta.fields:
                if self.contragent_field_map.has_key(field.name):
                    value = self._convert_value(field, source_row[self.contragent_field_map[field.name]])
                    setattr(contragent, field.name, value)
        
        # возвращаем контрагента и связанный с ним объект предметной области
        return [contragent, obj]