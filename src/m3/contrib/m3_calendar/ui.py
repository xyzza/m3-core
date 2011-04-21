#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''
from m3.helpers import urls
from m3.ui.ext.containers.containers import ExtContainer
from m3.ui.ext.containers.forms import ExtPanel
from m3.ui.ext.windows.window import ExtWindow

class M3CalendarWindow(ExtWindow):
    '''Окно с маленькими календарями для всех месяцев в году'''
    def __init__(self, *args, **kwargs):
        super(M3CalendarWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.template_globals = 'showM3Calendar.js'
        self.date_save_url = urls.get_url('save_calendar_date')
        self.get_date_url = urls.get_url('get_dates_to_ui')

        table_container = ExtContainer(layout='table', height=600, width=800)
        table_container.layout_config = dict(columns=4, rows=3)
        self.table_container = table_container

        for i in xrange(12):
            self.table_container.items.append(ExtPanel(layout='fit'))
        self.items.append(self.table_container)
        self.title = u'Календарь рабочих и выходных дней'
        self.width = 740
        self.height = 540

        self._listeners['afterrender'] = 'generateCalendars'