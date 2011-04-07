#coding:utf-8
'''
Created on 06.04.2011

@author: kamashev
'''

from engine import (BaseDataSource,)
import sqlite3


class SQLiteXDataSource(BaseDataSource):
    '''
    Объект, предоставляющий доступ к источнику данных формата SQLite
    '''

    def __init__(self, db_path, query, parameters = ()):
        super(SQLiteXDataSource, self).__init__()

        self.db_path = db_path
        self.query = query #точки входа параметров из кортежа параметров указывать знаками вопроса ?
        self.parameters = parameters or () #параметры, передаваемые в WHERE, HAVING, VALUES()

        self._cursor = None
        self._connection = None
        self._fetching = False
        self._fields = []

    def open_session(self):
        '''
        Открывает сессию обмена информацией с SQLite.
        '''
        self._fetching = False
        if self._cursor:
            self._cursor.close()

        self._connection = sqlite3.connect(self.db_path) #Если базы не существует?
        self._cursor = self._connection.cursor()
        self._fields = []
    
    def close_session(self):
        '''
        Закрывает сессию обмена информацией с SQLite.
        '''
        self._fetching = False
        if self._cursor:
            self._cursor.close()
            self._cursor = None
        if self._connection:
            self._connection.close()
            self._connection = None

    def read(self):
        '''
        Читает очередную порцию данных из источника данных. Возвращает None 
        в случае, если поток данных из источника закончен
        '''
        if not self._fetching:
            # выполняем запрос в базу данных
            self._cursor.execute(self.query, self.parameters)
            self._fields = map(lambda x: x[0], self._cursor.description)
            self._fetching = True
        
        for row in self._cursor:
            row_dict, i = {}, 0
            for field in self._fields:
                row_dict[field] = row[i]
                i += 1

            yield row_dict