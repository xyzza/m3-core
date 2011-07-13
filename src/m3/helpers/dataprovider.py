#coding:utf-8
"""
Created on 08.07.2011

@author: kirov
"""

from django.db.models import Model, Manager
from django.db.models.query import QuerySet
from django.db.models.query_utils import Q

class BaseRecord(object):
    """
    Базовый объект записи
    """
    def __init__(self, *args, **kwargs):
        self.init_component(*args, **kwargs)

    def init_component(self, *args, **kwargs):
        """
        Заполняет атрибуты экземпляра значениями в kwargs,
        если они проинициализированы ранее
        """
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self, k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

    def load(self, data):
        """
        Загрузка данных data в запись
        """
        pass

    def calc(self):
        """
        Пост-обработка записи, когда все реквизиты заполнены
        """
        pass

    def save(self):
        """
        Сохранение записи
        """
        pass

    def delete(self):
        """
        Удаление записи
        """
        pass
    
    def validate(self):
        """
        Проверка записи на корректность заполнения
        """
        pass


class GetRecordsParams(object):
    def __init__(self, *args, **kwargs):
        self.begin = None
        self.end = None
        self.filter = {}
        self.sorting = {}
        self.request = None
        self.context = None
        
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self, k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

class BaseRecordProvider(object):
    """
    Базовый класс провайдера записей
    """
    record_class = BaseRecord
    data_source = None

    def __init__(self, *args, **kwargs):
        self.init_component(*args, **kwargs)

    def init_component(self, *args, **kwargs):
        """
        Заполняет атрибуты экземпляра значениями в kwargs,
        если они проинициализированы ранее
        """
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self, k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

    def get_record_class(self, *args, **kwargs):
        """
        Получение класса записи.
        По-умолчанию берется из record_class
        """
        return self.record_class

    def get_data(self, *args, **kwargs):
        """
        Получение данных для записей.
        По-умолчанию берется из data_source
        """
        return self.data_source

    def new_record(self, data=None):
        """
        Создать запись по переданным данным
        """
        record = self.get_record_class()()
        record.load(data)
        return record

    def update_record(self, key, data):
        """
        Обновить запись получаемую по ключевым реквизитам переданными данными
        """
        record = self.get_record(key)
        record.load(data)
        return record

    def get_record(self, key):
        """
        Получить одну запись по ключевым реквизитам
        """
        return None

    def get_records(self, params):
        """
        Получить список записей по запрашиваемым параметрам
        """
        assert isinstance(params, GetRecordsParams)
        return {'rows':None, 'total':None}

    def delete_records(self, keys):
        """
        Удалить одну/несколько запись по ключевым реквизитам
        """
        if isinstance(keys, (list, tuple)):
            for key in keys:
                record = self.get_record(key)
                record.delete()
        else:
            record = self.get_record(keys)
            record.delete()

class BaseRecordModelProvider(BaseRecordProvider):
    """
    Базовый провайдер для моделей
    """
    key_field = 'id'

    def get_data(self, *args, **kwargs):
        data = super(BaseRecordModelProvider, self).get_data(*args, **kwargs)
        assert isinstance(data, QuerySet) or isinstance(data, Manager) or isinstance(data, Model)
        if isinstance(data, Model):
            return data.objects
        else:
            return data

    def get_filter(self, filter_dict):
        """
        Получение фильтра для модели по переданному словарю с фильтрами
        """
        filter = None
        for field, value in filter_dict.items():
            if isinstance(value, (list,tuple)):
                expr = Q(**{field+'__in': value})
            else:
                expr = Q(**{field: value})
            if filter:
                filter = filter & expr
            else:
                filter = expr
        return filter
    
    def get_filter_key(self, key):
        """
        Получение фильтра для модели по переданному ключу
        """
        # заложим сразу, что ключем могут быть несколько полей
        filter_key = {}
        if isinstance(self.key_field, (list, tuple)):
            filter_key.fromkeys(self.key_field)
        if isinstance(key, (str, unicode, int)):
            if isinstance(self.key_field, (str, unicode)):
                filter_key[self.key_field] = key
            else:
                filter_key[self.key_field[0]] = key
        elif isinstance(key, dict):
            filter_key.update(key)
        # отфильтруем по ключу
        return self.get_filter(filter_key)
        
    def get_record(self, key):
        # получим данные из базы
        data = self.get_data()
        db_record = data.get(self.get_filter_key(key))

        # если данные совпадают с объектом записи, то не нужно создавать объект
        record_class = self.get_record_class()
        if issubclass(record_class, data.model):
            record = db_record
        else:
            record = record_class()
        record.load(db_record)

        return record

    def before_query_data(self, query):
        return query

    def get_records(self, params):
        assert isinstance(params, GetRecordsParams)
        filter = self.get_filter(params.filter)
        data = self.get_data()
        record_class = self.get_record_class()
        # TODO: пока сортировка сделана только по одному полю
        sort_fields = []
        if len(params.sorting.keys()) == 1:
            sort_field = params.sorting.keys()[0]
            sort_dir = params.sorting.values()[0]
            if sort_dir == 'DESC':
                sort_fields.append('-' + sort_field)
            else:
                sort_fields.append(sort_field)
            data = data.order_by(*sort_fields)
        # перед непосредственным запросом может кто-то захочет что-то поменять
        data = self.before_query_data(data)
        
        if params.end:
            db_records = data.all()[params.begin:params.end]
        else:
            db_records = data.all()
        total = data.count() 
        records = []
        for db_record in db_records:
            # если данные совпадают с объектом записи, то не нужно создавать объект
            if issubclass(record_class, data.model):
                record = db_record
            else:
                record = record_class()
            record.load(db_record)
            records.append(record)
        return {'rows':records, 'total':total}

    def new_record(self, data=None):
        data = self.get_data()
        record_class = self.get_record_class()
        # если данные совпадают с объектом записи, то не нужно создавать объект
        if issubclass(record_class, data.model):
            record = data.model()
        else:
            record = record_class()
        record.load(data)
        return record