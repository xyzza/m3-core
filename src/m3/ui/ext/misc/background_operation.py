#coding:utf-8
__author__ = 'ZIgi'

from m3.ui.ext.base import BaseExtComponent,ExtUIComponent
from m3.ui.ext.misc.progress_bar import ExtProgressBar

class BackgroundOperationBar(ExtProgressBar):

    def __init__(self, *args, **kwargs):
        super(BackgroundOperationBar, self).__init__(*args,**kwargs)
        self._ext_name = 'Ext.m3.BackgroundOperationBar'

        #промежуток опроса сервера в мс. По умолчанию 1000
        self.interval = None
        
        self.init_component(*args, **kwargs)

    def render_base_config(self):
        super(BackgroundOperationBar, self).render_base_config()
        self._put_config_value('interval', self.interval)

