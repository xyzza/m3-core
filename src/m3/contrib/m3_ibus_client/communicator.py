#coding:utf-8
'''
Created on 15.08.2011

@author: akvarats
'''

import poster.streaminghttp
import urllib2
from urlparse import urljoin

import m3.misc.ibus
import helpers

class Communicator(object):
    '''
    Класс, используемый для отправки сообщений (запросов)
    '''
    
    def ping(self):
        '''
        Пихает известные в системе транспорты и возвращает результат в виде словаря
        {host: True/False}, где True соответствует серверу, который ответил на 
        пихательный запрос нормально.
        '''
        result = {}
        
        transport_urls = helpers.get_transport_urls()
        for url in transport_urls:
            req = urllib2.Request(urljoin(url, m3.misc.ibus.ServerUrls.PING))
            result[url] = False # призумпция виновности транспорта
            
            res = urllib2.urlopen(req)
            result[url] = res.code == 200 and res.msg == 'OK' and res.read() == m3.misc.ibus.PING_SUCCESSFUL_REQUEST
            
        return result
        
    
    def send_request(self, request):
        '''
        @param request: объект класса, унаследованного от m3_ibus_client.requests.BaseRequest
        '''
        
        poster.streaminghttp.register_openers()
        datagen, headers = request.encode()
        
        transport_urls = helpers.get_transport_urls()
        for url in transport_urls:
            # FIXME тут нужно, чтобы конкатенация урлов происходила корректно
            req = urllib2.Request(urljoin(url, m3.misc.ibus.ServerUrls.SEND_MESSAGE), datagen, headers)
            urllib2.urlopen(req)   