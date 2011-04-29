#coding:utf-8
'''
Created on 27.04.2011

@author: akvarats
'''

from django.test import TestCase
from django.db import connections

from m3.db import ddl

from migrator import SimpleMigrator
from django.db.utils import DatabaseError

class DiffTests(TestCase):
    
    def test_exceptions(self):
        '''
        В ходе теста проверяем выдачу исключительных ситуаций на случаи когда
        в метод миграции передаются некорректные пары левой и правой таблиц.
        '''
        migrator = ddl.BaseMigrator()
        
        left_table = ddl.DBTable('my_table')
        right_table = ddl.DBTable('my_table')
        another_table = ddl.DBTable('another_table')
        
        # во всех указанных ниже комбинациях параметров методы должны громко падать
        self.assertRaises(Exception, migrator.migrate, to_version=None)
        self.assertRaises(Exception, migrator.migrate, to_version=ddl.NullTable)
        self.assertRaises(Exception, migrator.migrate, to_version=ddl.NullTable, from_version=ddl.NullTable)
        
        self.assertRaises(Exception, migrator.migrate, to_version=None, from_version=left_table)
        self.assertRaises(Exception, migrator.migrate, to_version=left_table, from_version=another_table)
        self.assertRaises(Exception, migrator.migrate, to_version=another_table, from_version=right_table)
        #self.assertRaises(Exception, migrator.migrate, to_version=left_table, from_version=right_table)
        
    def test_create_drop_table(self):
        '''
        Проверяем как выполняется создание таблиц
        '''
        right_table = ddl.DBTable('my_table')
        right_table.fields.append(ddl.IDField())
        right_table.fields.append(ddl.CharField(name='name_field', max_length=200))
        
        migrator = SimpleMigrator()
        migrator.migrate(from_version=ddl.NullTable(),
                         to_version=right_table,)       
        
        cursor = connections['default'].cursor()
        cursor.execute('SELECT count(name_field) FROM my_table')
        for row in cursor:
            self.assertEqual(row[0], 0)
            
            
        migrator.migrate(from_version=right_table,
                         to_version=ddl.NullTable(),)
            
        cursor = connections['default'].cursor()
        self.assertRaises(DatabaseError, cursor.execute, 'SELECT count(name_field) FROM my_table')
        
    def test_append_field(self):
        
        table1 = ddl.DBTable('my_table')
        table1.fields.append(ddl.IDField())
        table1.fields.append(ddl.CharField(name='name_field', max_length=200))
        
        table2 = ddl.DBTable('my_table')
        table2.fields.append(ddl.IDField())
        table2.fields.append(ddl.CharField(name='name_field', max_length=200))
        table2.fields.append(ddl.CharField(name='xyz_field', max_length=200))
        
        migrator = SimpleMigrator()
        migrator.migrate(from_version=ddl.NullTable(),
                         to_version=table1,)
        
        migrator.migrate(from_version=table1,
                         to_version=table2,)
        
        cursor = connections['default'].cursor()
        cursor.execute('SELECT count(xyz_field) FROM my_table')
        for row in cursor:
            self.assertEqual(row[0], 0)
            
        migrator.migrate(from_version=table2, to_version=ddl.NullTable())