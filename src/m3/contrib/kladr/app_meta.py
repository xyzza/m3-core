#coding:utf-8

from django.conf import urls

from m3.ui.actions import ActionController
from actions import kladr_controller, KLADRPack

def register_actions():
    kladr_controller.packs.append(KLADRPack)
    #kladr_controller.rebuild_patterns()

def register_urlpatterns():
    '''
    Регистрация конфигурации урлов для приложения m3.contrib.kladr
    '''
    return urls.defaults.patterns('',
                                  (r'^m3-kladr', 'm3.contrib.kladr.app_meta.kladr_view'),
                                  )

#===============================================================================
# Представления
#===============================================================================
def kladr_view(request):
    return kladr_controller.process_request(request) 