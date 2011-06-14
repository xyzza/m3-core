#coding:utf-8
from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.results import OperationResult, BaseResult
from m3.core.plugins import extension_point

from django.conf import settings

import urllib2

__author__ = 'Excinsky'

@extension_point(name='ssacc-ping')
def ssacc_ping(*args, **kwargs):
    server_ssacc_ping()
    return OperationResult().return_response()

@extension_point(name='ssacc-ping2')
def ssacc_ping2(*args, **kwargs):
    return OperationResult().return_response()

##############################################################################
#Обращения к веб-сервисам системы
##############################################################################
try:
    SSACC_SERVER = settings.SSACC_SERVER
except AttributeError:
    SSACC_SERVER = 'http://localhost'

def server_ssacc_ping():
    ping_url = '/ssacc/ping2'
    try:
        request = urllib2.urlopen(SSACC_SERVER+ping_url)
        result_xml = request.read()
    except urllib2.HTTPError, e:
        raise SSACCException(u'Не удалось соединиться с SSACC сервером.')
        #NOTE(Excinsky): Здесь может быть лучше вызывать ErrorResult

    result = BaseResult.parse_xml_to_result(result_xml)
    return result