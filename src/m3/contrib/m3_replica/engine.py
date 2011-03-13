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
        '''
        try:
            # предварительные инициализационные действия
            self.source.open_session()
            self.target.open_session()
            
            for row in self.source.read():
                source_row = self.post_read(row)
                objects = self.handle(source_row)
                objects = self.pre_write(source_row, objects)
                result = self.target.write(objects)
                self.post_write(source_row, result or objects)
        finally:
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
        self.cache_factory = None
        
    def get_replica(self, key, object_type=None, *args, **kwargs):
        '''
        Получает реплицированный объект из базы данных
        '''
        ikey = self.get_replica_id(key, object_type)
        if ikey and object_type:
            return get_object_by_id(object_type, ikey)
        
        return None
    
    def get_replica_id(self, key, object_type=None, *args, **kwargs):
        '''
        Возвращает идентификатор реплицированного объекта. Отличается от
        get_replica тем, что возвращается просто идентификатор объекта
        без указания  
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
    def __init__(self, db_name, query):
        '''
        Инициализирует состояние источника данных.
        
        @param db_name: наименование базы данных
        '''
        super(DjangoSQLDataSource, self).__init__()
        
        self.db_name = db_name
        self.query = query
        
        self._cursor = None
        self._fetching = False
        
    def open_session(self):
        '''
        Открывает соединение к базе данных и получает курсор 
        '''
        self._fetching = False
        if self._cursor:
            self._cursor.close()
            
        self._cursor = connections[self.db_name].cursor()
        
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
            
        for row in self._cursor:
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
        
        Возвращает список тех же самых объектов, которые были указаны в 
        параметрах метода, однако.
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
    
class ModelDataTarget(BaseDataTarget):
    
    def __init__(self):
        super(ModelDataTarget, self).__init__()
        
    def write(self, objects):
        '''
        Выполняет сохранение переданных(-ой) моделей(-и) в базу данных.
        
        Управление транзакциями должно происходить на уровне выше.
        '''
        if (isinstance(objects, list) or
            isinstance(objects, tuple)):
            for object in objects:
                object.save()
        elif isinstance(objects, dict):
            for object in objects.values():
                object.save()
        elif isinstance(objects, models.Model):
            objects.save()
            
        return objects