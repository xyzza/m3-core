#coding:utf-8
'''
Created on 11.08.2011

@author: akvarats
'''
from m3.misc.ibus import InteractionMode


from communicator import Communicator
import requests
import responses

#===============================================================================
# Методы проверки доступности транспортных серверов
#===============================================================================
def pint_transports_details():
    '''
    Пингует известные транспортные сервера и возвращает словарь доступности серверов
    '''
    return Communicator().ping()

def ping_transports():
    '''
    Пингует известные транспортные сервера и возвращает True в случае,
    если все сервера доступны.
    '''
    return len(filter(lambda x: not x, pint_transports_details().values())) == 0
    


def send_models_async(objects=[], category=''):
    '''
    Выполняет отсылку объектов получателям через транспортный сервер
    
    @param objects: список объектов, которые подлежат отправке по транспорту
    @param mode: режим, в котором должна выполняться отсылка сообщения
    @category: категория сообщения, предназначенная для определения получателей.
    '''
    request = requests.SimpleObjectRequest(category='@'+category if category else '', objects=objects, mode=InteractionMode.ASYNC)    
    response = Communicator().send_request(request)
    
    return response
