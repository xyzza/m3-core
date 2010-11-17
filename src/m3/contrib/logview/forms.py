#coding:utf-8
'''
Created on 25.10.2010

@author: kir
'''
import datetime

from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.shortcuts import js_close_window
from m3.ui.ext.fields.simple import ExtComboBox, ExtTextArea, ExtDateField
from m3.ui.ext.containers.container_complex import ExtContainerTable
from m3.ui.ext.windows.window import ExtWindow
        
class ExtLogsWindow(ExtWindow):
    def __init__(self, window_params=None, *args, **kwargs):
        super(ExtLogsWindow, self).__init__(*args, **kwargs)
        self.__dict__.update(window_params)
        self.title=u'Просмотр логов'
        self.min_width, self.min_height = self.width, self.height = 750, 500
        self.modal = False
        self.maximizable = True
        self.layout = 'vbox'
        self.layout_config = {'align': 'stretch'}
        self.template_globals = 'ui-js/mis-admin.js'
        
        self.date = ExtDateField(
            label=u'Выберите дату', 
            name='start_date',
            allow_blank=False, 
            hide_today_btn=True,
            value = datetime.datetime.now()
        )        
        self.logFilesCombo  = ExtComboBox(
            label = u'Выберите файл',
            editable = False, 
            display_field = 'name',
            value_field = 'name',
            mode = 'remote',
            trigger_action_all = 'true'
        )
        
        self.text_field = ExtTextArea(region='center', read_only=True, flex=1)
        
        fs_period = ExtContainerTable(columns=3, rows=1, height=28)
        fs_period.set_item(row=0, col=0, cmp=self.date, width=200)
        fs_period.set_item(row=0, col=2, cmp=self.logFilesCombo, width=300)
        fs_period.set_properties(col_num=1, width=30)
            
        self.items.extend([fs_period, self.text_field])
        
        #Button's
        self.update_button = ExtButton(text=u'Обновить', hidden=True)
        self.update_button.handler = 'callBackfunc_combo'
        cancel_button = ExtButton(text=u'Закрыть')
        cancel_button.handler = js_close_window(self)
        self.buttons.extend([self.update_button, cancel_button])