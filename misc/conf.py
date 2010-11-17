#coding:utf-8
import os

VERSION = '0.5'

PROJECT_PATH = os.path.abspath(__file__)
M3_PROJECT_PATH = os.path.dirname(os.path.dirname(PROJECT_PATH))

# Путь до статики m3
STATIC_PATH = os.path.join(M3_PROJECT_PATH, 'src', 'm3', 'static')

# Путь до внешних js
OUTER_JS_FOLDER = os.path.join(STATIC_PATH, 'ext', 'js')

# Путь до своих js
INNER_JS_FOLDER = os.path.join(STATIC_PATH, 'm3', 'js')

# Приоритетные js файлы для загрузки
HIGH_PRIORITY = ('m3.js', 
                 'ComboBox.js', 
                 'Grid.js', 
                 'TreeGrid.js',
                 'Window.js', 
                 'AdvancedTreeGrid.js')
# Файлы с наименьшем приоритетом
LOW_PRIORITY = ('containers.js', 'override.js',)

# Название файла
FILE_NAME = 'm3-debug.js'

# Название файла для production'а
FILE_NAME_OPT = 'm3-opt.js'

#Игнорируемые файлы
EXCLUDE = ('Calendar.js', FILE_NAME, FILE_NAME_OPT)

