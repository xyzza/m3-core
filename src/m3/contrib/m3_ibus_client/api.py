#coding:utf-8
'''
Created on 11.08.2011

@author: akvarats
'''
#from enums import InteractionMode
#from requests import SendObjectsRequest  

IBUS_SECTION_SETTINGS_NAME = 'ibus-client'
IBUS_TRANSPORTS_SETTINGS_NAME = 'TRANSPORTS'

def read_transports_config(conf, ibus_client_section=IBUS_SECTION_SETTINGS_NAME):
    '''
    Считывает настройки списка транспортов, используемых для передачи данных
    '''
    return filter(lambda x: x, conf.get(ibus_client_section, IBUS_TRANSPORTS_SETTINGS_NAME).split(','))

#def send_objects(objects=[], mode=InteractionMode.ASYNC):
#    '''
#    Отправка синхронного запроса в транспортный сервер
#    '''
#    request = SendObjectsRequest(category)
