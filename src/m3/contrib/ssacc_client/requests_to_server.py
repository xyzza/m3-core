#coding:utf-8

import urllib2
import urllib
import urlparse

from django.conf import settings

from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.results import BaseResult, ErrorResult, \
     ProfileRatesResult, OperationResult, AvailabilityResult

__author__ = 'Excinsky'

##############################################################################
#Обращения к веб-сервисам системы
##############################################################################
#TODO(Excinsky): Превратить в объект

try:
    #Получаем расположение ссакосервера.
    SSACC_SERVER = settings.SSACC_SERVER
except AttributeError:
    SSACC_SERVER = 'http://localhost'


def ssacc_send_request(url, params=None):
    """
    Подключается к SSACC серваку, и получает ответ, либо выбрасывает ошибку.

    @param url: добавочный урл на сервере.
    @param params: параметры запроса.
    @raise SSACCException
    @return: str
    """
    encode_utf8 = lambda x: dict((k, v.encode("utf-8") if isinstance(v, unicode)
                                  else v) for k, v in x.items())
    if params:
        request = urllib2.Request(url, urllib.urlencode(encode_utf8(params)))
    else:
        request = url

    sock = None
    try:
        sock = urllib2.urlopen(request)
        return sock.read()
    except (ValueError, urllib2.URLError, urllib2.HTTPError):
        raise SSACCException(u"Не удалось соединиться с SSACC сервером.")
    finally:
        if sock is not None:
            sock.close()


def check_if_result_is_ok_and_return_parsed_result(result_xml,
        additional_result_type):
    """
    Превращает пришедшую XML во враппер-объект.

    Возвращает ErrorResult, или результат, необходимый пользователю.

    @param result_xml: XML из которого будут делать враппер.
    @type result_xml: string.
    @param additional_result_type: Тип объекта-враппера, если не XML не сообщает
        об ошибках.
    @type additional_result_type: BaseResult child class.
    @return: BaseResult child instance.
    """
    is_result_ok = BaseResult.is_result_ok(result_xml)
    if is_result_ok:
        result_type = additional_result_type
    else:
        result_type = ErrorResult
    result = BaseResult.parse_xml_to_result(result_xml, result_type)
    return result


def _send_post_request(url, params=None, result_class=OperationResult):
    # Отправка POST-запрса на сервер и получение ответа в виде враппера:
    response = ssacc_send_request(
        urlparse.urljoin(SSACC_SERVER, url), params)
    return check_if_result_is_ok_and_return_parsed_result(
        response, result_class)


def server_ssacc_ping():
    """
    Обращение к системе за пустым запросом.

    @raise: SSACCException.
    @return: OperationResult or ErrorResult
    """
    return _send_post_request('/ssacc/ping')


def server_ssacc_profile_rates(account_id):
    """
    Обращение к системе за тарифным планом аккаунта.

    @return: ProfileRatesResult or ErrorResult
    """
    return _send_post_request(
        '/ssacc/profile/rates',
        result_class=ProfileRatesResult)


def server_ssacc_availability(account_id):
    """
    Обращение к системе за возможностью использования.

    @return: AvailabilityResult or ErrorResult
    """
    return _send_post_request(
        '/ssacc/profile/availability',
        result_class=AvailabilityResult)


def server_ssacc_operator_new(account_id, login, username, enc_password):
    """Сообщает серверу о создании нового оператора.
    """
    return _send_post_request(
        "/ssacc/operator/new",
        dict(account_id=account_id, login=login,
             username=username, enc_password=enc_password))


def server_ssacc_operator_edit(account_id, old_login, old_enc_password,
                               new_login, new_username, new_enc_password):
    """Сообщает серверу об изменении существующенго оператора.
    """
    return _send_post_request(
        "/ssacc/operator/edit",
        dict(account_id=account_id, old_login=old_login,
             old_enc_password=old_enc_password, new_login=new_login,
             new_username=new_username, new_enc_password=new_enc_password))


def server_ssacc_operator_delete(account_id, login, enc_password):
    """Сообщает серверу об удалении оператора.
    """
    return _send_post_request(
        "/ssacc/operator/delete",
        dict(account_id=account_id, login=login, enc_password=enc_password))
