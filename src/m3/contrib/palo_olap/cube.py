#coding:utf-8

import datetime
from m3.contrib.palo_olap.view_manager import ViewManager
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
    standart_views = {} #словарь с преднастроенными вьшками (создаются отчеты имя = ключ тело = xml из таблицы palo_view 
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
        def format_dim_result(res, dim):
            msg = u'<br/>Обработка измерения %s завершена.' % dim.name
            t = ''
            for k,v in res.items():
                if t!= '': t+=', '
                t += u'%s:%s' % (k,v)
            if t:
                msg += '(%s)' % t
            return msg

        if not self.name:
            raise Exception(u'Не указано имя куба для %s' % self.__class__.__name__)
        #проверим все дименшены
        res = u''
        for dim in self.dimensions:
            dim = dim() #превратим в инстанс наш синглетоновый дименшен
            p = dim.process(with_clear)
            res += format_dim_result(p, dim)
        if not self._cube:
            #создадим дименшен в пало
            self._cube = self.get_palo_cube()
    
        self.clear()
        cnt = self.load_data()
        res += u'<br/>Обработка куба %s завершена. Элементов: %i' % (self.name, cnt)
        self.after_process()
        return res
        
    def load_data(self):
        '''
        самый главный метод загружает данные
        на этом этапе уже все есть надо только строить квари и записывать
        '''
        return 0
    
    def after_process(self):
        self._processed = True
        self._processed_time = datetime.datetime.now()
        self.create_standart_views()
        
    def get_palo_cube_id(self):
        '''
        вернуть код дименшена в пало сервере
        '''
        assert self._processed
        return self._cube.get_id()

    def create_standart_views(self):
        for view in self.standart_views:
            ViewManager.sync_view_for_cube(view, self)
    
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
        
                