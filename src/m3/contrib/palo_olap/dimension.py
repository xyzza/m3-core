#coding:utf-8
import datetime
from m3.contrib.palo_olap.server_api.server import PaloServer
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_NUMERIC

class BasePaloDimension(object):
    '''
    класс для описания общих методов для дименшенов
    '''
    name = None #имя дименшена (должно быть уникодовым)
    _processed = False #обработано ли измерения (выгружены все свежие данные)
    
    def __init__(self, server_host, user, password, db_name):
        self._server_host = server_host
        self._user = user
        self._password = password
        self._db_name = db_name
        self._dim = self.get_palo_dim()

    def get_palo_dim(self):
        '''
        вернуть PaloDimension и подключение к серверу
        '''
        p = PaloServer(server_host=self._server_host, user=self._user, password=self._password)
        p.login()
        db = p.get_or_create_db(self._db_name)
        
        if db.dimension_exists(self.name):
            dim = db.get_dimension(self.name)
        else:
            dim = db.create_dimension(self.name)
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

        if not self.name:
            raise Exception(u'Не указано имя измерения для %s' % self.__class__.__name__)
        if with_clear:
            self.clear()

class PaloDimension(BasePaloDimension):
    '''
    класс для работы с дименшеном данные которого определны прям тут
    '''
    data = [] #тут определны данные лист уникодовых строк
    _elements = {} #словарь элементов по имени

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
        self._processed = True
        return result
        
             
    

    