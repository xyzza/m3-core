#coding:utf-8
from django.http import HttpResponse

from xml.dom import minidom
from m3.contrib.ssacc_client.exceptions import SSACCException

__author__ = 'Excinsky'


class BaseResult(object):
    def __init__(self):
        self._xml_response = minidom.Document()
        self._result_node = self._xml_response.createElement('result')
        self._xml_response.appendChild(self._result_node)

    def _get_xml_response(self):
        return self._xml_response

    def _get_result_node(self):
        return self._result_node

    def _get_xml_content(self):
        return self._get_xml_response().toprettyxml(indent='  ')

    def return_response(self):
        return HttpResponse(content=self._get_xml_content(),
            mimetype='text/xml')

    @staticmethod
    def parse_xml_to_result(xml_string):
        document = minidom.parseString(xml_string)
        result_nodes = document.getElementsByTagName('result')
        if not len(result_nodes):
            raise SSACCException(u'Ошибка преобразования из xml, формат не '
                u'поддерживается SSACC')
        result_node = result_nodes[0]
        result_status_attribute = result_node.getAttribute('status')

        if result_status_attribute == 'ok':
            return OperationResult()
        elif result_status_attribute == 'error':
            message = result_node.getAttribute('message')
            code = result_node.getAttribute('error_code')
            return ErrorResult(message, code)


class ErrorResult(BaseResult):
    def __init__(self, message, error_code):
        super(ErrorResult, self).__init__()
        self._message = message
        self._error_code = error_code

    def return_response(self):
        self._get_result_node().setAttribute('status', 'error')
        self._get_result_node().setAttribute('error_code', self._error_code)
        self._get_result_node().setAttribute('message', self._message)

        return super(ErrorResult, self).return_response()


class OperationResult(BaseResult):
    def return_response(self):
        self._get_result_node().setAttribute('status', 'ok')
        print self._get_xml_content()

        return super(OperationResult, self).return_response()
