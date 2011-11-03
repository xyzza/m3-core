#coding:utf-8

import os

project_path = os.path.dirname(__file__)

__version__ = '0.0'
__appname__ = u'Тестовое приложение для платформы М3'

__require__ = {
# референс на тестируемую платформу ставится в __require_locals__
#    'm3': '1.0',
}

# исходные тексты Платформы М3 всегда забираем локально из текущего репозитория
# поэтому путь такой вот
__require_local__ = {
    'm3': os.path.realpath(os.path.join(project_path, '../../')),
}
