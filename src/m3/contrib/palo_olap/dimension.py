#coding:utf-8
import datetime
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_NUMERIC

class SingletonMeta(type):
    def __init__(self, name, bases, dict):
        super(SingletonMeta, self).__init__(name, bases, dict)
        self.instance = None
        
    def __call__(self,*args,**kw):
        if self.instance is None:
            self.instance = super(SingletonMeta, self).__call__(*args, **kw)
        return self.instance

class BasePaloDimension(object):
    '''
    класс для описания общих методов для дименшенов
    '''

    __metaclass__ = SingletonMeta #наш класс быдет синглетоном
    name = None #имя дименшена (должно быть уникодовым)
    alias = None #алиас дименшена используется при генерации куба для короткого его названия
    _processed = False #обработано ли измерения (выгружены все свежие данные)
    _db = None #родительская база в которой мы находимся
    _dim = None #PaloDimension with connect
    
    def __init__(self, db):
        if self._db and self._db != db:
            raise Exception(u'%s уже иницилизирован для базы %s' % (self.__class__.__name__, self._db))
        self._db = db

    @property
    def processed(self):
        """Get the current voltage."""
        return self._processed

    def get_palo_dimension_id(self):
        '''
        вернуть код дименшена в пало сервере
        '''
        assert self._processed
        return self._dim.get_id()
    
    def get_palo_dim(self):
        '''
        вернуть PaloDimension
        '''
        if self._db.get_palo_db().dimension_exists(self.name):
            dim = self._db.get_palo_db().get_dimension(self.name)
        else:
            dim = self._db.get_palo_db().create_dimension(self.name)
        return dim

    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        self._dim.clear()
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''
        print u'Обработка измерения %s %s' % (self.__class__.__name__, with_clear) 

        if not self.name:
            raise Exception(u'Не указано имя измерения для %s' % self.__class__.__name__)
        if not self._dim:
            #создадим дименшен в пало
            self._dim = self.get_palo_dim()
        if with_clear:
            self.clear()

    def after_process(self):
        '''
        вызвается после обработки
        '''
        self._processed = True

class PaloDimension(BasePaloDimension):
    '''
    класс для работы с дименшеном данные которого определны прям тут
    '''
    data = [] #тут определны данные лист уникодовых строк
    _elements = {} #словарь элементов по имени

    def get_id(self, name):
        assert self._processed
        if name not in (self.data):
            raise Exception(u'Нельзя получить ид для "%s" элемент не входит в словарь данных %s' % (name, self.__class__.__name__))
        return self._elements.get(name)

    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''
        super(PaloDimension, self).process(with_clear)
        all = self._dim.get_all_elements()
        deleted = 0
        inserted = 0
        self._elements = dict()
        for id, name in all:
            if name not in self.data:
                self._dim.deleteElement(id)
                deleted += 1
            else:
                self._elements[name] = id
        for name in self.data:
            if name not in self._elements.keys():
                id = self._dim.create_element(name)
                self._elements[name] = id
                inserted += 1
        self._processed = True

        result = dict()
        result[u'Новых'] = inserted
        result[u'Удаленных'] = deleted
        self.after_process()
        return result
        
             
    

    