#coding:utf-8
from m3.contrib.m3_docs.actions import DocumentTypePack

__author__ = 'ZIgi'


from django.conf import urls as django_urls
from actions import DocumentsPack
from m3.ui.actions import ActionController

documents_controller = ActionController('/m3-docs')


def register_actions():
    documents_controller.packs.extend([DocumentsPack, DocumentTypePack])

def register_urlpatterns():
    return django_urls.defaults.patterns('', (r'^m3-docs/', documents_view) )

def documents_view(request):
    return documents_controller.process_request(request)
  