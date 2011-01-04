#coding:utf-8
'''
Created on 04.01.2011

@author: kirov
'''
import calendar

from django.test import TestCase
from m3.contrib.palo_olap.server import PaloServer
from m3.contrib.palo_olap.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_STRING

class PaloTests(TestCase):
    '''
    Тесты Palo Olap
    '''
    
    def test_1(self):
        p = PaloServer(server_host='localhost',user='admin',password='admin')
        # подключаемся к серверу
        p.login()
        # загружаем список баз
        p.load_db_list()
        # проверяем наличие базы 'olap_test'
        if p.db_exists('olap_test'):
            # получаем базу
            db = p.get_db('olap_test')
        else:
            # создаем базу
            db = p.create_db('olap_test')
        
        #db.load_dimensions()
        # проверим в базе наличие размерности 'years'
        if db.dimension_exists(u'Года'):
            d_years = db.get_dimension(u'Года')
        else:
            d_years = db.create_dimension(u'Года')
        
        # очистим размерность
        d_years.clear()
        # заполним ее годами
        years_list = []
        for year in range(2000,2010):
            res = d_years.create_element(u'%s год' % year, type = ELEMENT_TYPE_STRING)
            years_list.append(res[1]) # тут имя элемента
        d_years.create_consolidate_element(u'Все года', years_list)
        
        # тоже сделаем и с месяцами
        if db.dimension_exists(u'Месяцы'):
            d_mons = db.get_dimension(u'Месяцы')
        else:
            d_mons = db.create_dimension(u'Месяцы')
        d_mons.clear()
        month_list = []
        for month in range(1,12):
            res = d_mons.create_element(calendar.month_name[month], type = ELEMENT_TYPE_STRING)
            month_list.append(res[1])
        d_mons.create_consolidate_element(u'Все месяцы', month_list)
        
        # попробуем добавить большое количество учреждений
        if db.dimension_exists(u'Учреждения'):
            d_units = db.get_dimension(u'Учреждения')
        else:
            d_units = db.create_dimension(u'Учреждения')
        d_units.clear()
        unit_list = []
        for unit in range(1,10000):
            res = d_units.create_element(u'Учреждение №%s' % unit, type = ELEMENT_TYPE_STRING)
            unit_list.append(res[1])
        d_units.create_consolidate_element(u'Все учреждения', unit_list)