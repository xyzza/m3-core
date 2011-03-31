#coding:utf-8
from m3.ui.ext.windows.window import ExtWindow

__author__ = 'daniil-ganiev'


class NotifyMessagesListWindow(ExtWindow):

    def __init__(self):
        super(NotifyMessagesListWindow, self).__init__()
        self.width, self.height = 600, 300
        self.maximized = False
        self.maximizable = True
        self.title = u'Реестр шаблонов для рассылки'
        self.layout = 'fit'
#        self.items.extend([])