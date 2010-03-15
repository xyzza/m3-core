#coding:utf-8
'''
Created on 11.03.2010

@author: akvarats
'''

class ImproperlyConfigured(Exception):
    def __init__(self, reason=''):
        self.reason = reason