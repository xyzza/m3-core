#coding:utf-8
'''
Created on 21.11.2010

@author: akvarats
'''

from django.test import TestCase
from ui import SimpleWindow

class GenericExtUITests(TestCase):
    
    def test_0(self):
        pass
    
    
#===============================================================================
# Тесты механизма назначения нормальных наименований контролам
#===============================================================================
class QNamesTests(TestCase):
    '''
    Тесты, в которых проверяется работа механизма назначения псевдопостоянных
    наименований контролам.
    '''
    def test_simple_windows(self):
        '''
        Проверяем назначение имени для очень простой формы
        '''
        window = SimpleWindow()
        window.prepare_qnames()
        
        self.failUnlessEqual(window.qname, 'SimpleWindow')
        self.failUnlessEqual(window.ok_button.qname, 'SimpleWindow__ok_button')
        self.failUnlessEqual(window.cancel_button.qname, 'SimpleWindow__cancel_button')
        
