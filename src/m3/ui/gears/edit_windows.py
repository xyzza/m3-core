#coding:utf-8
'''
Базовые окна редактирования

Created on 14.12.2010

@author: akvarats
'''

from m3.ui.ext import windows
from m3.ui.ext import panels
from m3.ui.ext import controls
from m3.ui.ext import containers


class GearEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования, в котором лежит форма и в котором есть кнопки OK и Отмена.
    
    Размеры окна по умолчанию 600x400 
    ''' 
    def __init__(self, *args, **kwargs):
        super(GearEditWindow, self).__init__(*args, **kwargs)
        
        self.width = 600
        self.height = 400
        self.title = ''
        
        self.form = panels.ExtForm()
        
        self.buttons.extend([controls.ExtButton(text=u'ОК', handler='submitForm'),
                             controls.ExtButton(text=u'Отмена', handler='cancelForm')])
        
        
class GearTableEditWindow(GearEditWindow):
    '''
    Окно редактирования с лежащим внутри табличным контейнером.
    
    Количество строк и столбцов необходимо передавать через параметры конструкта:
    * columns: количество столбцов (по умолчаию - 2)
    * rows: количество строк (по умолчанию - 4)
    '''
    def __init__(self, columns=2, rows=4, *args, **kwargs):
        super(GearTableEditWindow, self).__init__(*args, **kwargs)
        
        self.table = containers.ExtContainerTable(columns=columns, rows=rows)
        self.form.items.append(self.table)