#coding:utf-8
from django.conf.urls.defaults import patterns

__author__ = 'Excinsky'

def register_urlpatterns():
    """
    Регистрация конфигурации урлов для приложения
    """
    return patterns('',
        (r'^ssacc/ping$', 'm3.contrib.ssacc_client.views.ssacc_ping'),
        (r'^ssacc/profile/meta$',
            'm3.contrib.ssacc_client.views.ssacc_profile_meta'),
        (r'^ssacc/operator/meta$',
            'm3.contrib.ssacc_client.views.ssacc_operator_meta'),
        (r'^ssacc/license/meta$',
            'm3.contrib.ssacc_client.views.ssacc_license_meta'),
        (r'^ssacc/operator/exists$',
            'm3.contrib.ssacc_client.views.ssacc_operator_exists'),
        (r'^ssacc/profile/new$',
            'm3.contrib.ssacc_client.views.ssacc_profile_new'),
        (r'^ssacc/profile/edit$',
            'm3.contrib.ssacc_client.views.ssacc_profile_edit'),
        (r'^ssacc/operator/new$',
            'm3.contrib.ssacc_client.views.ssacc_operator_new'),
        (r'^ssacc/operator/edit$',
            'm3.contrib.ssacc_client.views.ssacc_operator_edit'),
        (r'^ssacc/profile/delete$',
            'm3.contrib.ssacc_client.views.ssacc_profile_delete'),
        (r'^ssacc/operator/delete$',
            'm3.contrib.ssacc_client.views.ssacc_operator_delete'),
    )
  