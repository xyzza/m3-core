#coding:utf-8
'''
Created on 20.01.2011

@author: kir
'''
from django.shortcuts import render_to_response
from m3.ui.actions import Action, ActionPack

class Check_IE6(Action):
    '''
    Заглушка для IE6
    '''
    url = '/ie6'
    def run(self, request, context):
        return render_to_response('index.html')
        

class CheckBrowserActionsPack(ActionPack):
    '''
    Набор действий для проверки браузеров
    '''
    def __init__(self):
        super(self.__class__,self).__init__()
        self.Check_IE6 = Check_IE6()
        
        self.actions = [ self.Check_IE6]
        