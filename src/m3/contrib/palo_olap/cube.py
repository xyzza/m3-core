#coding:utf-8

from m3.contrib.palo_olap.model_dimension import ModelBassedPaloDimension
import datetime

class SingletonMeta(type):
    def __init__(self, name, bases, dict):
        super(SingletonMeta, self).__init__(name, bases, dict)
        self.instance = None
        
    def __call__(self,*args,**kw):
        if self.instance is None:
            self.instance = super(SingletonMeta, self).__call__(*args, **kw)
        return self.instance

class PaloCube(object):

    __metaclass__ = SingletonMeta #наш класс быдет синглетоном

    name = None #имя куба (должно быть уникодовым)
    dimensions = [] #список измерений 
    _processed = False #обработан ли куб
    _processed_time = None #время последнего общета куба
    _db = None #родительская база в которой мы находимся
    _cube = None #куб пало
    _bulked = False #признак того что идет пакетная загрузка
    
    
    def __init__(self, db):
        if self._db and self._db != db:
            raise Exception(u'%s уже иницилизирован для базы %s' % (self.__class__.__name__, self._db))
        self._db = db

    @property
    def processed(self):
        '''
        обработан ли он в принцепе
        '''
        return self._processed

    @property
    def processed_time(self):
        '''
        когда последний раз обрабатывался
        '''
        return self._processed_time
    
    def get_palo_cube(self):
        '''
        вернуть PaloCube и подключение к серверу
        '''
        if self._db.get_palo_db().cube_exists(self.name):
            cube = self._db.get_palo_db().get_cube(self.name)
        else:
            # 6 измерений
            dims = []
            for dim in self.dimensions:
                dim = dim() #превратим в инстанс наш синглетоновый дименшен
                if not dim.processed:
                    raise Exception(u'Попытка создать куб на основе необработанного измерения %s' % dim)
                dims.append(dim.get_palo_dimension_id())
            cube = self._db.get_palo_db().create_cube(self.name, dims)
        return cube
    
    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        self._cube.clear_all()
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''
        if not self.name:
            raise Exception(u'Не указано имя измерения для %s' % self.__class__.__name__)
        #проверим все дименшены
        for dim in self.dimensions:
            dim = dim() #превратим в инстанс наш синглетоновый дименшен
            dim.process(with_clear)
        if not self._cube:
            #создадим дименшен в пало
            self._cube = self.get_palo_cube()
    
        self.clear()
        self.load_data()
        self.after_process()
        
    def load_data(self):
        '''
        самый главный метод загружает данные
        на этом этапе уже все есть надо только строить квари и записывать
        '''
        pass
    
    def after_process(self):
        self._processed = True
        self._processed_time = datetime.datetime.now()
    
    def start_bulk(self):
        '''
        начиваем пакетную вставку данных
        '''
        self._bulk_coords = {}
        self._bulked = True
    
    def end_bulk(self):
        '''
        завершение пакетной операции и запись всего накопленного в пало
        '''
        assert self._bulked
        assert self._bulk_coords

        paths = ':'.join(self._bulk_coords.keys())
        values = ':'.join(map(unicode, self._bulk_coords.values()))
        self._cube.replace_bulk(paths, values)
        self._bulked = False
        
    def _find_coordinate(self, dim, params):
        '''
        находит значение координаты для переданного измерения
        '''
        for k in params.keys():
            if dim.alias and k == dim.alias:
                #нашли по алиасу
                return k
            if dim.name and k == dim.name:
                #нашли по имени
                return k
            if dim.__name__.lower() == k.lower():
                #нашли по имени класса
                return k
        raise Exception(u'Не удалось опеределить координату для измерения %s' % dim.__name__)
    
    def _extarct_all_coordinates(self, params):
        '''
        возвращает список идишников координат в переданных параметрах
        params = dict с идишниками
        '''
        res = []
        for dim in self.dimensions:
            param = self._find_coordinate(dim, params)
            val = params.pop(param)
            res.append(str(val))
        if params.keys():
            raise Exception(u'Переданные параметры не соответвуют заявленным измерениям: ' % u','.join(params.keys()))
        return res
    
    def add_value(self, value, **kwargs):
        '''
        добавить значение в пакетное добавление
        в каргах лежат идишники пало измерений
        название параметров = алиасам дименшенов или их именам
        '''
        assert self._bulked
        coordinates = self._extarct_all_coordinates(kwargs)
        key = ','.join(coordinates)
        if self._bulk_coords.has_key(key):
            self._bulk_coords[key] += value
        else:
            self._bulk_coords[key] = value
        
        
        
class PaloCubeQueryHelpers(object):
    '''
    методы помогающие строить query для извелечени данных для куба и работать с ним
    '''
    @classmethod
    def add_dimension_stores_related(cls, cube, query):
        '''
        добавляет все релатед таблицы дименшенов используемых для куба
        '''
        for dim in cube.dimensions:
            if isinstance(dim, ModelBassedPaloDimension):
                query = query.select_related(dim.get_store_related_name())
        return query

    @classmethod
    def add_dimension_stores_filter(cls, cube, query):
        '''
        добавляет фильтры по всем релатед таблицам дименшенов используемых для куба
        '''
        for dim in cube.dimensions:
            if issubclass(dim, ModelBassedPaloDimension):
                filter = dict()
                filter['%s__palo_id__isnull' % dim.get_store_related_name()] = False
                query = query.filter(**filter)
        return query
    
    @classmethod
    def extract_dimension_coordinates(cls, cube, obj):
        '''
        добавляет фильтры по всем релатед таблицам дименшенов используемых для куба
        '''
        res = dict()
        for dim in cube.dimensions:
            if issubclass(dim, ModelBassedPaloDimension):
                store = getattr(obj, dim.get_store_related_name())
                if store:
                    val = store.palo_id
                else:
                    val = dim().get_unknown_element_id()
                res[dim.alias or dim.__name__] = val
                    
        return res
