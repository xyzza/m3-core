#coding: utf-8
from m3.contrib.m3_sandbox import SandboxKeeper
from django.conf import urls as django_urls

__author__ = 'ZIgi'

def register_actions():
    pass

def register_urlpatterns():
    controllers = SandboxKeeper.get_sandbox_controllers()
    urls = []

    for k,v in controllers.items():
        urls += django_urls.defaults.patterns('', ('^sandbox/' + k + '/',
                                              lambda request: v.process_request(request)))

    return urls