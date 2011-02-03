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
    all_name = None #имя для консолидированного элемента (все элементы) если ноне то сгенерируется автоматически
    need_all_consolidate_element = True #нужно ли создавать консолидирующей элемент ВСЕ
    alias = None #алиас дименшена используется при генерации куба для короткого его названия
    _processed = False #обработано ли измерения (выгружены все свежие данные)
    _processed_time = None #время последнего общета куба
    _db = None #родительская база в которой мы находимся
    _dim = None #PaloDimension with connect
    _all_id = None #код консолидирующего элменеты ВСЕ
    
    def __init__(self, db):
        if self._db and self._db != db:
            raise Exception(u'%s уже иницилизирован для базы %s' % (self.__class__.__name__, self._db))
        self._db = db

    def get_all_consolidate_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        raise NotImplementedError

    def get_all_consolidate_element_name(self):
        '''
        возвращает имя для консолидайт элемента "ВСЕ"
        '''
        return self.all_name or u'Все %s' % self.name.lower()    

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
        self._processed_time = datetime.datetime.now()

class PaloDimension(BasePaloDimension):
    '''
    класс для работы с дименшеном данные которого определны прям тут
    '''
    data = [] #тут определны данные лист уникодовых строк
    _elements = {} #словарь элементов по имени
    

    def get_data(self):
        '''
        возвращает данные для загрузки
        '''
        return self.data
    
    def _get_data(self):
        '''
        возвращает данные для загрузки + элемент все
        для сохраннеия общности пришлось бы копировать список ([self.get_all_consolidate_element_name(), ].extend(self.get_data())
        но мы запотимся о памяти и просто вставим элемент в лист
        '''
        data = self.get_data()
        if not self.get_all_consolidate_element_name() in data:
            data.append(self.get_all_consolidate_element_name())
        return data

    def get_id(self, name):
        assert self._processed
        if name not in (self._get_data()):
            raise Exception(u'Нельзя получить ид для "%s" элемент не входит в словарь данных %s' % (name, self.__class__.__name__))
        return self._elements.get(name)
    
    def get_all_consolidate_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        assert self.need_all_consolidate_element
        return self._elements[self.get_all_consolidate_element_name()]
    
    def process_all_consolidate_elemet(self):
        '''
        добавление всех элементов в консолидирующий элемент
        '''
        palo_id = self.get_all_consolidate_element_id()
        childs = []
        for name, id in self._elements.items():
            if name != self.get_all_consolidate_element_name():
                childs.append(id)
        self._dim.replace_consolidate_element(palo_id, childs)
        
    
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
            if name not in self._get_data():
                self._dim.deleteElement(id)
                deleted += 1
            else:
                self._elements[name] = id
        for name in self._get_data():
            if name not in self._elements.keys():
                id = self._dim.create_element(name)
                self._elements[name] = id
                inserted += 1
        self._processed = True
        if self.need_all_consolidate_element:
            self.process_all_consolidate_elemet()
        result = dict()
        result[u'Новых'] = inserted
        result[u'Удаленных'] = deleted
        self.after_process()
        return result
        
             
    

    