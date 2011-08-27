#coding:utf-8

IBUS_SECTION_SETTINGS_NAME = 'ibus-client'
IBUS_TRANSPORTS_SETTINGS_NAME = 'TRANSPORTS'
IBUS_SENDER_SETTINGS_NAME = 'SENDER'


def read_transports_config(conf, ibus_client_section=IBUS_SECTION_SETTINGS_NAME):
    '''
    Считывает настройки списка транспортов, используемых для передачи данных
    '''
    return filter(lambda x: x, conf.get(ibus_client_section, IBUS_TRANSPORTS_SETTINGS_NAME).split(','))

def read_sender_config(conf, ibus_client_section=IBUS_SECTION_SETTINGS_NAME):
    '''
    Считывает настройки отправителя запросов в транспортный сервер
    '''
    return conf.get(ibus_client_section, IBUS_SENDER_SETTINGS_NAME)