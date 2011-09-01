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

import responses

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
            req = urllib2.Request(url=urljoin(url, m3.misc.ibus.ServerUrls.PING))
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
            req = urllib2.Request(urljoin(url, m3.misc.ibus.ServerUrls.FORWARD_MESSAGE), datagen, headers)
            try:
                res = urllib2.urlopen(req)
                
                response_body = res.read()
                if response_body[0:11] != 'request_id:':
                    return responses.TransportServiceError(error_message=u'Недопустимый протокол общения с транспортным сервером')
                
                return responses.AsyncResponse(message_id=response_body[11:].strip())
            except urllib2.HTTPError as exc:
                return responses.TransportServiceError(error_code = exc.code,
                                                       error_message = exc.msg if hasattr(exc, 'msg') else '')
                # тут в error_message стоит конструкция if-else потому, что 
                # какбе в офдоке нет указания на то, что такой атрибут у
                # объекта исключения есть. лучше перебздеть, чем обосраться.
            except urllib2.URLError as exc:
                return responses.TransportServerUnavailable(error_message=exc.reason)    
            