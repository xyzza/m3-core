#coding:utf-8
'''
Created on 18.02.2011

@author: kir
@version 0.1 (alpha)
'''
from django.template.loader import render_to_string

from sentry.plugins import GroupActionProvider

class LocalTest(GroupActionProvider):
    '''
    '''
    title = 'Local test'

    def widget(self, request, group):
        return render_to_string('sentry/plugins/sentry_localtest/widget.html', locals())