#coding:utf-8
'''
Created on 10.03.2011

@author: akvarats
'''
from django.db import (connections, 
                       models,
                       transaction,)

from m3.db.api import get_object_by_id

from m3.data.caching import ModelObjectStorageFactory

from api import (register_imported_model,
                 get_ikey)

from log import (ExchangeLog, 
                 ExchangeLogEntry,)

#===============================================================================
# Класс-описатель 
#===============================================================================
class ReplicatedObjectsPackage(object):
    '''
    Пакет объектов, которые подлежат репликации
    '''
    def __init__(self):
        self.objects = []
        self.keys_map = {}
        self.replicated_objects = []
        
    def append(self, obj, external_key):
        '''
        Добавляет объект с его внешним ключом к списку объектов
        '''
        if not obj in self.objects:
            self.objects.append(obj)
        
        self.keys_map[obj] = external_key
        
    def get_objects(self):
        '''
        Возвращает плоский список объектов для сохранения
        '''
        return self.objects
    
    def iter_objects(self):
        '''
        Возвращает элементы пакета в виде кортежа (объект, значение внешнего ключа)
        '''
        for obj in self.objects:
            yield (obj, self.get_key(obj))
        
    def get_key(self, obj, default=''):
        '''
        Возвращает внешний ключ, соответствующий указанному объекту.
        
        В случае если объекта нет в пакете, то возвращается либо указанное значение
        по умолчанию, либо пустая строка.
        '''
        return self.keys_map.get(obj, default)
    
    def mark_replicated(self, obj):
        '''
        Помечает объект в пакете, как уже реплицированный. Данный метод полезен
        в случае, если сохранение объектов происходит в нестандартных местах
        системы 
        '''
        self.replicated_objects.append(obj)
        
    
    def already_replicated(self, obj):
        '''
        Возвращает True в случае, если объект был 
        '''
        return obj in self.replicated_objects
        
        
# для целей сокращения записи
ROP = ReplicatedObjectsPackage

#===============================================================================
# Классы, управляющие выполнением операций по импорту-экспорту данных
#===============================================================================
class BaseDataExchange(object):
    '''
    Класс, отвечающий за проведение операции передачи данных от источника к 
    приемнику
    '''
    def __init__(self, source, target, replica_storage=None, objects_storage=None):
        '''
        Инициализация объекта обмена данными.
        
        @param source: объект типа DataSource, представляющий интерфейс доступа 
                       к конкретному экземпляру источника данных. 
        @param target: объект типа DataTarget, представляющий интерфейс доступа
                       к конкретному экземпляру получателя данных.
        @param replica_storage: объект типа ReplicationStorage, предоставляющий
                                интерфейс доступа к реплицированным ранее 
                                объектам.
        '''
        self.source = source
        self.target = target
        self.replica_storage = replica_storage or ModelReplicationStorage()
        self.objects_storage = objects_storage or ModelObjectStorageFactory()
        self.log = ExchangeLog()
        
    def handle(self, source_row=None):
        '''
        Основной метод, который используется для преобразования порции данных,
        пришедшей из источника данных, в приемник. 
        '''
        raise NotImplementedError()
    
    @transaction.commit_on_success
    def run(self):
        '''
        Метод выполнения операции по передаче данных от источника к приемнику
        
        Возвращает лог выполнения операции.
        '''
        self.log = ExchangeLog()
        try:
            # предварительные инициализационные действия
            self.source.open_session()
            self.target.open_session()
            
            for row in self.source.read():
                source_row = self.post_read(row)
                objects = self.handle(source_row)
                
                log_entries = self.validate(source_row, objects)
                has_errors = False
                for entry in (log_entries if isinstance(log_entries, list) else [log_entries, ]):
                    if not entry:
                        continue
                    self.log.append(entry)                    
                    has_errors = has_errors or entry.type == ExchangeLogEntry.ERROR
                    
                if has_errors:
                    # в случае наличия ошибок обработка текущей строки источника
                    # данных дальше не выполняется
                    continue 
                
                objects = self.pre_write(source_row, objects)
                result = self.target.write(objects)
                self.post_write(source_row, result or objects)
        finally:
            self.post_process()
            self.source.close_session()
            self.target.close_session()
            self.objects_storage.drop()
        
    #===========================================================================
    # Разные полезные дефолтные обработчики
    #===========================================================================
    def post_read(self, source_row):
        '''
        Вызывается после выполнения чтения данных из источника.
        '''
        return source_row
    
    
    def pre_write(self, source_row, object_to_write):
        '''
        Метод, который вызывается перед передачей объекта на сохранение в 
        приемник данных.
        
        Метод можно перекрывать в дочерних классах для выполнения модификации
        '''
        return object_to_write
    
    def post_write(self, source_row, written_object):
        '''
        Вызывается после успешной записи в приемник данных
        '''
        pass
    
    def validate(self, source_row, objects):
        '''
        Метод валидации загруженного объекта. Вызывается перед выполнением
        pre_write.
        
        Специфические методы валидации должны перекрываться в дочерних классах.
        В случае если валидация значений не выполнена, то должен возвращаться 
        объект (список объектов) типа m3_replica.engine.ExchangeLogEntry
        
        В случае если среди возвращенных значений встретиться запись с типом
        ExchangeLogEntry.ERROR, то обработка текущей строки из источника данных
        будет приостановлена
        '''
        return None
    
    def post_process(self):
        """
        Метод пост-обработки данных, вызывается в самом конце обработки данных,
        перед закрытием сессии источника данных
        """
        pass  
    
#===============================================================================
# Базовые классы для репликации 
#===============================================================================
class BaseReplicationStorage(object):
    '''
    Базовый класс для интерфейсов доступа к репликационной информации 
    при выполнении операций импорта-экспорта данных
    '''
    def __init__(self):
        pass
    
    def get_replica(self, key, object_type=None, *args, **kwargs):
        '''
        Получает информацию по реплицированным ранее объектам.
        
        Данный метод необходимо переопределять в дочерних классах. 
        
        @param key: ключ, по которому определяется реплицированный объект. 
                    Обычно, в качестве ключа выступает значение внешнего
                    идентификатора объекта 
        '''
        raise NotImplementedError()
    
    def save_replica(self, key, replica, *args, **kwargs):
        '''
        Сохраняет реплику объекта с указанным внешним идентификатором.
        
        @param key: значение ключа, по которому потом будет выполняться 
                    восстановление реплики.
        @param replica: объект, который впоследствие будет считаться репликой
                        для объекта с указанным ключем.
        '''
        raise NotImplementedError()
    
    def close(self):
        '''
        Закрывает соединение с хранилищем репликаций. Данный метод должен
        быть переопределен в дочерних классах
        '''
        raise NotImplementedError()
    
    
class ModelReplicationStorage(BaseReplicationStorage):
    '''
    Хранилище репликаций на основе записей моделей бизнес-сущностей и 
    ImportedObject 
    '''
    def __init__(self):
        super(ModelReplicationStorage, self).__init__()
        
        # фабрика кешей объектов, которые используются при операциях над данными. 
        self.cache_factory = ModelObjectStorageFactory()
        
    def get_replica(self, key, object_type=None, default=None, *args, **kwargs):
        '''
        Получает реплицированный объект из базы данных
        '''
        ikey = self.get_replica_id(key, object_type)
        if ikey and object_type:
            return self.cache_factory.get_storage(object_type).get(ikey)
            #return get_object_by_id(object_type, ikey)
        
        # объект в модели репликации не найден, возвращаем указанное значение
        # по умолчанию
        return default
    
    def get_replica_id(self, key, object_type=None, *args, **kwargs):
        '''
        Возвращает идентификатор реплицированного объекта. Отличается от
        get_replica тем, что возвращается просто идентификатор объекта
        (а не сам реплицированный объект).
        '''
        return get_ikey(key, object_type) 
        
    
    def save_replica(self, key, replica, *args, **kwargs):
        '''
        Сохраняет информацию о реплике внешнего объекта в нашей базе данных
        '''
        
        if not isinstance(replica, models.Model):
            raise TypeError(u'Объект реплики не является наследником класса django.db.Model (текущий тип: %s.%s)' % (replica.__class__.__module__,
                                                                                                                     replica.__class__.__name__))
        
        register_imported_model(replica, key)
        
    
#===============================================================================
# Описание источников данных
#===============================================================================
class BaseDataSource(object):
    '''
    Объект, представляющий интерфейс доступа к источникам данных 
    '''
    def __init__(self):
        pass
    
    def open_session(self):
        '''
        Открывает сессию обмена информацией с источником данных. Метод должен
        быть переопределен в дочерних классах.
        '''
        raise NotImplementedError()
    
    def close_session(self):
        '''
        Закрывает сессию обмена информацией с источником данных. Метод должен
        быть переопределен в дочерних классах.
        '''
        raise NotImplementedError()
    
    
    def read(self):
        '''
        Читает очередную порцию данных из источника данных. Возвращает None 
        в случае, если поток данных из источника закончен
        '''
        return None

class DjangoSQLDataSource(BaseDataSource):
    '''
    Описывает источник данных в виде 
    '''
    def __init__(self, db_name, query, as_dict=False):
        '''
        Инициализирует состояние источника данных.
        
        @param db_name: наименование базы данных
        '''
        super(DjangoSQLDataSource, self).__init__()
        
        self.db_name = db_name
        self.query = query
        self.as_dict = as_dict
        
        self._cursor = None
        self._fetching = False
        self._fields = []
        
    def open_session(self):
        '''
        Открывает соединение к базе данных и получает курсор 
        '''
        self._fetching = False
        if self._cursor:
            self._cursor.close()
            
        self._cursor = connections[self.db_name].cursor()
        self._fields = []
        
    def close_session(self):
        '''
        Закрывает соединение с базой данных
        '''
        self._fetching = False
        if self._cursor:
            self._cursor.close()
            self._cursor = None
            
    def read(self):
        '''
        Возвращает генератор, который фетчит записи из курсора с указанным 
        запросом.
        '''
        if not self._fetching:
            # выполняем запрос в базу данных
            self._cursor.execute(self.query)
            if self.as_dict:
                self._fields = map(lambda x: x[0], self._cursor.description)
            self._fetching = True

        for row in self._cursor:
            if self.as_dict:
                row_dict, i = {}, 0
                for field in self._fields:
                    row_dict[field] = row[i]
                    i += 1
                yield row_dict
            else:
                yield row


#===============================================================================
# Описание приемников данных 
#===============================================================================
class BaseDataTarget(object):
    '''
    Базовый класс для интерфейсов доступа к приемникам данных
    '''
    def __init__(self):
        pass

    def write(self, objects):
        '''
        Выполняет запись объектов в приемник данных.
        
        @param objects: список объектов (либо одиночный объект), приедназначенных
        для сохранения в приемнике данных. 
        
        Возвращает список тех же самых объектов, которые были указаны в 
        параметрах метода.
        '''
        raise NotImplementedError()
    
    def open_session(self):
        '''
        Открывает сессию взаимодействия с получателем данных
        '''
        pass
    
    def close_session(self):
        '''
        Закрывает сессию взаимодействия с получателем данных
        '''
        pass
    
