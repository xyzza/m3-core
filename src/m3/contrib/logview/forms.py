#coding:utf-8
'''
Created on 25.10.2010

@author: kir
'''
import datetime

from m3.ui.ext.windows.base import BaseExtWindow
from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.shortcuts import js_close_window
from m3.ui.ext.containers.forms import ExtFieldSet
from m3.ui.ext.fields.simple import ExtComboBox, ExtTextArea, ExtDateField
from m3.ui.ext.containers.containers import ExtContainer
        
class ExtLogsWindow(BaseExtWindow):
    def __init__(self, window_params=None, *args, **kwargs):
        super(ExtLogsWindow, self).__init__(*args, **kwargs)
        self.__dict__.update(window_params)
        self.title=u'Система логирования'
        self.width = 750
        self.height = 500
        self.modal = False
        self.layout = 'border'
        self.template_globals = 'ui-js/mis-admin.js'
        fs_period = ExtFieldSet(
            title=u'Выберите период', 
            label_width = 120,
            height=70,
            layout = 'hbox',
            region = 'north'
            )
        #Так как при layout hbox текст label скрыт, обарачиваем элементы
        date_container = ExtContainer(
            layout='form', 
            label_width = 30
            )
        logFilesCombo_container = ExtContainer(layout='form')
        
        date = ExtDateField(
            label=u'Дата', 
            name='start_date',
            allow_blank=False, 
            hide_today_btn=True
            )
        date.value = datetime.datetime.now()
        date_container.items.append(date)
        
        self.date = date
        
        self.logFilesCombo  = ExtComboBox(
            label = u'Выберите файл',
            editable = False, 
            display_field = 'name',
            value_field = 'name',
            mode = 'remote',
            trigger_action_all = 'true'
        )
        logFilesCombo_container.items.append(self.logFilesCombo)
        
        fs_period.items.extend([date_container, logFilesCombo_container])
        
        self.text_field = ExtTextArea(region='center', read_only=True)
            
        self.items.extend([fs_period, self.text_field])
        
        #Button's
        self.update_button = ExtButton(text=u'Обновить', hidden=True)
        self.update_button.handler = 'callBackfunc_combo'
        cancel_button = ExtButton(text=u'Закрыть')
        cancel_button.handler = js_close_window(self)
        self.buttons.extend([self.update_button, cancel_button])