#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''
from datetime import datetime
from m3.contrib.m3_calendar.api import M3Calendar
from m3.contrib.m3_calendar.ui import M3CalendarWindow
from m3.ui.actions import ActionPack, Action
from m3.ui.actions.context import ActionContextDeclaration
from m3.ui.actions.dicts.simple import BaseDictionaryModelActions
from m3.ui.actions.results import ExtUIScriptResult, OperationResult
from m3.helpers import urls

from models import ExceptedDay

class M3CalendarPack(ActionPack):
    '''Пакет действий для календаря с праздничными и перенесенными днями'''
    url = '/m3-calendar'

    def __init__(self):
        super(M3CalendarPack, self).__init__()
        self.actions.extend([ShowCalendar, SaveCalendarDate,])

    def get_list_url(self):
        return urls.get_url('show_calendar')


class ShowCalendar(Action):
    url = '/show_calendar'
    shortname = 'show_calendar'

    def run(self, request, context):
        window = M3CalendarWindow()
        return ExtUIScriptResult(window)

class SaveCalendarDate(Action):
    url = '/save_calendar_date'
    shortname = 'save_calendar_date'

    def context_declaration(self):
        return [ActionContextDeclaration(name='date', required=True, type=str),
                ActionContextDeclaration(name='type', required=True, type=int)]

    def run(self, request, context):
        pydate = datetime.strptime(context.date, '%d.%m.%Y')
        M3Calendar.add_date_to_db(pydate, context.type)
        return OperationResult(success=True)


class ExceptedDay_DictPack(BaseDictionaryModelActions):
    '''
    Пакет действий для справочника праздничных и перенесенных дней
    '''
    url = '/excepted-days'
    shortname = 'm3-calendar-excepted-days'
    
    model = ExceptedDay
    
    list_columns = [('day', 'Дата', 100),
                    ('name', 'Название', 300),
                    ('type', 'Тип', 300),]
    filter_field = ['name',]
    list_sort_order = ['-day',]
    
    width, height = 700, 400