#coding:utf-8
from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.result_params import MetaParameter, MetaParameterTypeEnum, MetaParameterListItem
from m3.contrib.ssacc_client.results import OperationResult, BaseResult, ProfileMetaResult
from m3.core.plugins import extension_point

from django.conf import settings

import urllib2

__author__ = 'Excinsky'

@extension_point(name='ssacc-ping')
def ssacc_ping(*args, **kwargs):
    """
    Начальная точка расширения для вьюхи пустого запроса

    Args:
        *args, **kwargs: Без них точки расширения не работают.
    """
    return OperationResult().return_response()

@extension_point(name='ssacc-profile-meta')
def ssacc_profile_meta(*args, **kwargs):
    """
    Начальная точка расширения для вьюхи метаинформации о создании профиля.

    Args:
        *args, **kwargs: Без них точки расширения не работают.
    """
    int_param = MetaParameter('code1', 'name1', MetaParameterTypeEnum.INT)
    string_param = MetaParameter('code2', 'name2', MetaParameterTypeEnum.STRING)
    bool_param = MetaParameter('code3', 'name3', MetaParameterTypeEnum.BOOL)
    list_param = MetaParameter('code4', 'name4', MetaParameterTypeEnum.LIST)

    list_item_1 = MetaParameterListItem('1', '111')
    list_item_2 = MetaParameterListItem('2', '222', enabled=True)
    list_param.add_list_items(list_item_1, list_item_2)

    dict_param = MetaParameter('code5', 'name5', MetaParameterTypeEnum.DICT,
        target='dict_id')

    result = ProfileMetaResult(int_param, string_param, bool_param, list_param,
        dict_param)

    return result.return_response()

##############################################################################
#Обращения к веб-сервисам системы
##############################################################################
try:
    #Получаем расположение ссакосервера.
    SSACC_SERVER = settings.SSACC_SERVER
except AttributeError:
    SSACC_SERVER = 'http://localhost'

def server_ssacc_ping():
    """
    Обращение к системе за пустым запросом.
    """
    ping_url = '/ssacc/ping'
    try:
        request = urllib2.urlopen(SSACC_SERVER+ping_url)
        result_xml = request.read()
    except urllib2.HTTPError, e:
        raise SSACCException(u'Не удалось соединиться с SSACC сервером.')
        #NOTE(Excinsky): Здесь может быть лучше вызывать ErrorResult
    result = BaseResult.parse_xml_to_result(result_xml)
    return result