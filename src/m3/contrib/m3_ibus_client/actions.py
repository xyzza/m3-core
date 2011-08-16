#coding:utf-8
'''
Created on 11.08.2011

@author: akvarats
'''

from m3.ui import actions

class BusClientActionPack(actions.ActionPack):
    '''
    Набор экшенов для ibus_client
    '''
    def __init__(self):
        super(BusClientActionPack, self).super()
        
        
        
        
        
class AsyncResponseAction(actions.Action):
    '''
    Экшен, который срабатывает при поступлении ответа на асинхронный запрос
    '''
    def context_declaration(self):
        '''
        '''
        return
    
    def run(self):
        '''
        '''
        pass