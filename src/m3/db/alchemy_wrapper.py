#coding:utf-8
'''
Created on 12.05.2011
@author: Сафиуллин В. А.
'''
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.sqlsoup import SqlSoup
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import mapper
import sqlalchemy as sa

from m3.helpers import logger


#============================= ИСКЛЮЧЕНИЯ ==================================

class AlchemyWrapperError(Exception):
    pass

#=============================== КЛАССЫ ====================================

class SQLAlchemyWrapper(object):
    """ 
    Класс обёртка, предназначенный для подключения БД SqlAlchemy
    используя настройки Django:   
        wrapper = SQLAlchemyWrapper(settings.DATABASES)
    Содержит атрибуты необходимые для управлений БД и выполнения запросов:
        engine - подключение к БД
        metadata - коллекция из таблиц и колонок БД
        session - сессия для запросов
    """
    # Карта соответствия между драйверами Django и SqlAlchemy
    DRIVER_MAP = {
        "django.db.backends.sqlite3": "sqlite",
        "django.db.backends.postgresql_psycopg2": "postgresql",
        "django.db.backends.mysql": "mysql",
    }
    
    ERROR_NO_PK = 'could not assemble any primary key columns for mapped table'
    
    def __init__(self, db_config):
        # Создаем движок БД
        default_db = db_config['default']
        url = self._create_url(default_db)
        self.engine = sa.create_engine(url)
        
        # Реверс инжиниринг БД ;)
        self.soup = SqlSoup(self.engine)
        self.soup._metadata.reflect()
        self.metadata = self.soup._metadata
        self.session = self.soup.session
        
    def _create_url(self, db_config):
        """ Возвращает URL для соединения с БД """
        django_driver = db_config['ENGINE']
        driver = self.DRIVER_MAP.get(django_driver)
        if not driver:
            raise AlchemyWrapperError('Driver %s was not found in map' % django_driver)
        
        url = URL(
            drivername = driver,
            username = db_config['USER'], 
            password = db_config['PASSWORD'], 
            host = db_config['HOST'], 
            port = db_config['PORT'] or None, # От пустой строки алхимия падает
            database = db_config['NAME'])
        return url
    
    def create_map_class(self, class_name, table):
        """ Возвращает класс обертку над таблицей алхимии """
        base = declarative_base(name=str(class_name))
        try:
            return mapper(base, table)
        except Exception as e:
            msg = str(e)
            if msg.find(self.ERROR_NO_PK) > 0:
                logger.warning(msg)
                return
            raise e
    
    def get_models_map(self, create_mappers=False):
        """ 
        Возвращает объект для быстрого доступа к таблицам SqlAlchemy.
        Атрибуты объекта имеют имена соответствующих моделей Django, а
        их значения - мататаблицы алхимии.
        """
        try:
            from django.db.models.loading import cache
        except ImportError:
            raise AlchemyWrapperError('Cross import from settings.py')
        
        db = ModelCollection()
        for model in cache.get_models():
            attr_name = model._meta.object_name
            table_name = model._meta.db_table
            try:
                print table_name
                table = self.soup._metadata.tables[table_name]
            except KeyError:
                raise AlchemyWrapperError('Table %s was not reflected in SqlAlchemy metadata' % table_name)
            
            if create_mappers:
                table = self.create_map_class(attr_name, table)
                if not table:
                    continue
            
            db[attr_name] = table
            
        return db
            
    
class ModelCollection(dict):
    """ Объект хранящий атрибуты с именами моделей Django и значениями Table """
    
    def __getattr__(self, name):
        """ Доступ к значениям словаря через точку """
        try:
            return self[name]
        except KeyError:
            return super(ModelCollection, self).__getattr__(name)

    def __setitem__(self, k, v):
        """ При добавлении пары в словарь также появляется одноименный атрибут """
        super(ModelCollection, self).__setitem__(k, v)
        setattr(self, k, v)
