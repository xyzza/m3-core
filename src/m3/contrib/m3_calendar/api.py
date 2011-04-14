#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''

import calendar
from datetime import date
from m3.contrib.m3_calendar.models import ExceptedDayTypeEnum, ExceptedDay


class M3Calendar(calendar.Calendar):
# На всякий случай наследуемся от базового питонячьего класса для календаря.
# Если понадобится, сможем замутить мощную полноценную м3шную замену с учетом
# рабочих дней и их темплейтов


    # Программный слой накладывающихся на основной календарь выходных и
    # праздничных дней. Сначала накладывается программный слой, а затем
    # переопределенный пользователем слой из базы.
    template = None

    def __init__(self):
        self.days = []
        self.db_excepted_days = []

    def _clear_days(self):
        self.days = []

    def _get_excepted_days_from_db(self):
        '''
        Вытаскивает из бд все даты, которые пользователь обозначил как
        выходные и праздничные
        '''
        db_days = ExceptedDay.objects.all().distinct().order_by('day')

        self.db_excepted_days = [day.day for day in db_days if day.type
                                 in [ExceptedDayTypeEnum.DAYOFF,
                                     ExceptedDayTypeEnum.HOLIDAY]]

        self.db_working_days = [day.day for day in db_days
                                if day.type == ExceptedDayTypeEnum.WORKDAY]

    def _get_days_by_period(self, start_date, end_date):
        pass
        
    def is_working_date(self, cdate):
        '''
        Проверяет, является ли пришедшая дата рабочим днем.
        Должен быть перегружен в классах наследниках с учетом проверок
        на заданный атрибут класса template.
        По умолчанию исключает выходные дни и дни из бд
        '''
        return not isinstance(cdate, date) \
               and not (cdate.weekday() in (calendar.SATURDAY, calendar.SUNDAY))\
               and not (cdate in self.db_excepted_days)

    def working_days_by_period(self, start_date, end_date):
#        self.days = self._get_days_by_period()
        pass

    def working_days_by_bound(self, date, count, bound_since=True):
        pass
