#coding:utf-8
'''
Created on 15.08.2011

@author: akvarats
'''

import poster.streaminghttp
import urllib2
from urlparse import urljoin

import enums
import helpers

class Communicator(object):
    '''
    Класс, используемый для отправки сообщений (запросов)
    '''
    
    def send_request(self, request):
        '''
        @param request: объект класса, унаследованного от m3_ibus_client.requests.BaseRequest
        '''
        
        poster.streaminghttp.register_openers()
        datagen, headers = request.encode()
        
        transport_urls = helpers.get_transport_urls()
        for url in transport_urls:
            # FIXME тут нужно, чтобы конкатенация урлов происходила корректно
            req = urllib2.Request(urljoin(url, enums.ServerUrls.SEND_MESSAGE), datagen, headers)
            urllib2.urlopen(req)