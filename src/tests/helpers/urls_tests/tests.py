#coding:utf-8
'''
Created on 07.12.2010

@author: akvarats
'''

from django.test import TestCase

from m3.helpers.urls import get_action, get_pack, get_url

import actions as test_actions

class ActionNamesTests(TestCase):
    
    def test_main(self):
        
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction11'), '/urls-tests/pack1/action1')
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction12'), '/urls-tests/pack1/action2')
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction13'), '/urls-tests/pack1/action3')
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction21'), '/urls-tests/pack2/action1')
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction22'), '/urls-tests/pack2/action2')
        self.failUnlessEqual(get_url('tests.helpers.urls_tests.actions.TestAction23'), '/urls-tests/pack2/action3')