#coding:utf-8
from django.conf.urls.defaults import patterns

__author__ = 'Excinsky'

def register_urlpatterns():
    """
    Регистрация конфигурации урлов для приложения
    """
    return patterns('',
            (r'^ssacc/ping$','m3.contrib.ssacc_client.views.ssacc_ping'),
            (r'^ssacc/ping2$','m3.contrib.ssacc_client.views.ssacc_ping2'),
    )
  