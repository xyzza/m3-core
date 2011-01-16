#coding:utf-8
'''
Created on 16.01.2011

@author: akvarats
'''

import datetime

from m3.helpers import logger

class M3SimpleProfileMiddleware(object):
    
    def process_request(self, request):
        request.m3_simple_profile_start_time = datetime.datetime.now()
        
    def process_response(self, request, response):
        try:
            logger.debug(str(datetime.datetime.now() - request.m3_simple_profile_start_time) + ' ' + request.get_full_path())
        except:
            pass
                    
        return response