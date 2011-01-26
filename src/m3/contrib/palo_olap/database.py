#coding:utf-8
from m3.contrib.palo_olap.server_api.server import PaloServer

class SingletonMeta(type):
    def __init__(self, name, bases, dict):
        super(SingletonMeta, self).__init__(name, bases, dict)
        self.instance = None
        
    def __call__(self,*args,**kw):
        if self.instance is None:
            self.instance = super(SingletonMeta, self).__call__(*args, **kw)
        return self.instance
    
class PaloDataBase(object):
    '''
    класс для описания базы данных
    содержащихся в нем измерений и кубов
    '''
    __metaclass__ = SingletonMeta #наш класс быдет синглетоном
     
    name = None #Имя базы данных
    
    dimensions = [] #измерения(можно не заполнять все равно добавит из кубов
    cubes = []#список кубов
    
    _server_host = None
    _server_port = None 
    _user = None  #пользователь который будет обновлять и создавать все данные
    _password = None
    _palo_server = None
    _palo_db = None
    def __init__(self, server_host, server_port, user, password):
        '''
        создание базы данных (оно же подключение к пало серверу
        инициализация входящих в нее синглетонов (димешенов и кубов) 
        '''
        self._server_host = server_host
        self._server_port = server_port 
        self._user = user
        self._password = password
        
        #пройдемся по всем кубам и дименшенам
        for cube in self.cubes:
            cube(self) #создадим первый эксземлпяр, т.к. синглетон по сути это есть инициализация
            for dim in cube.dimensions:
                if dim not in self.dimensions:
                    self.dimensions.append(dim)
        for dim in self.dimensions:
            dim(self) #создадим первый эксземлпяр, т.к. синглетон по сути это есть инициализация
    
    def get_palo_db(self):
        '''
        создать или вернуть базу данных пало с подключением
        еще и проверить может с полсденго логина пора перелогиниваться
        '''
        if not self._palo_server:
            self._palo_server = PaloServer(server_host=self._server_host, user=self._user, password=self._password, server_port=self._server_port)
        #if self._palo_server.get_expired_time()<20:
        self._palo_server.login()
        if not self._palo_db:
            
            # загружаем список баз
            self._palo_server.load_db_list()
            # проверяем наличие базы 'olap_test'
            if self._palo_server.db_exists(self.name):
                # получаем базу
                self._palo_db = self._palo_server.get_db(self.name)
            else:
                # создаем базу
                self._palo_db = self._palo_server.create_db(self.name)
        return self._palo_db
    
    
    