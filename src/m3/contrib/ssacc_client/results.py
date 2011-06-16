#coding:utf-8
from xml.dom.minidom import Element
from django.http import HttpResponse

from xml.dom import minidom
from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.result_params import MetaParameter

__author__ = 'Excinsky'

class BaseResult(object):
    """
    Базовый облегающий класс над ответами.

    Упрощает работу с ответами SSACC сервера и клиента. Избавляет от
    необходимости возиться с XML.
    """
    def __init__(self):
        self._xml_response = minidom.Document()
        self._result_node = self._create_xml_response_node('result')
        self._append_node_to_xml_response(self._result_node)

    def _get_xml_response(self):
        return self._xml_response

    def _get_result_node(self):
        return self._result_node

    def _get_xml_content(self):
        """
        Возвращает ответ в виде XML строки.
        """
        return self._get_xml_response().toprettyxml(indent='  ')
    
    def _append_node_to_xml_response(self, node):
        """
        Добавляет элемент к вершине XML документа.

        @param node: Элемент для прикрепления.
        @type node: xml.dom.Node
        """
        self._get_xml_response().appendChild(node)

    def _create_xml_response_node(self, name):
        """
        Создает и возвращает элемент у вершины XML документа.

        @param name: Тег элемента.
        @type name: str

        @return xml.dom.Element
        """
        return self._get_xml_response().createElement(name)

    def return_response(self):
        """
        Возвращает ответ в виде HttpResponse с XML внутри.
        """
        return HttpResponse(content=self._get_xml_content(),
            mimetype='text/xml')

    @staticmethod
    def parse_xml_to_result(xml_string):
        """
        @static
        Преобразовывает XML строку в подходящий враппер.

        @param xml_string: XML строка.
        @type xml_string: str
        """
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
        else:
            raise SSACCException(u'Ошибка преобразования из xml, формат не '
                u'поддерживается SSACC')


class ErrorResult(BaseResult):
    """
    Облегающий класс над ответом об ошибке.
    """
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
    """
    Облегающий класс над ответом о положительном результате операции.
    """
    def return_response(self):
        self._get_result_node().setAttribute('status', 'ok')

        return super(OperationResult, self).return_response()


class ProfileMetaResult(BaseResult):
    """
    Облегающий класс над ответом на запрос метаинформации для создания профиля.
    """
    def __init__(self, *args):
        """
        @param *args: Параметры ответа.
        @type *args: list of result_params.MetaParameter
        """
        super(ProfileMetaResult, self).__init__()

        self._param_node_list = []
        self._param_list = args
        
        self._init_param_list()

    def _init_param_list(self):
        """
        Превращает пришедший список параметров ответа в список xml.dom.Element

        @return:None
        """
        for param in self._param_list:
            if isinstance(param, MetaParameter):
                node = self._create_xml_response_node('param')
                self._prepare_node_from_meta_param(node, param)
                self._add_to_param_nodes(node)
                self._get_result_node().appendChild(node)

    def _add_to_param_nodes(self, *args):
        """
        Добавляет элементы к списку параметров ответа.

        @param args: Элементы, которые надо добавить
        @type args: list of xml.dom.Element
        @return: None.
        """
        for node in args:
            self._param_node_list.append(node)

    def _prepare_node_from_meta_param(self, node, param):
        """
        Подготавливает xml.dom.Element из result_params.MetaParameter

        @param node: xml.dom.Element
        @param param: result_params.MetaParameter
        @return: None.
        """
        node.setAttribute('code', param.get_code())
        node.setAttribute('name', param.get_name())
        node.setAttribute('type', param.get_type_value())
        node.setAttribute('hint', param.get_hint())

        if param.is_list():
            self._prepare_list_items(node, param)

        if param.is_dict():
            node.setAttribute('target', param.get_target())

    def _prepare_list_items(self, node, param):
        """
        Подготавливает элементы списка, в случае, если тип параметра -- list
        @param node: xml.dom.Element
        @param param: result_params.MetaParameter
        @return: None
        """
        for item in param.get_list_items():
            item_node = Element('item')
            item_node.setAttribute('code', item.get_code())
            item_node.setAttribute('name', item.get_name())
            item_node.setAttribute('parent', item.get_parent())
            item_node.setAttribute('enabled', item.get_enabled_string())

            node.appendChild(item_node)

    def _get_node_list(self):
        return self._param_node_list

    def return_response(self):
        self._get_result_node().setAttribute('status', 'ok')

        return super(ProfileMetaResult, self).return_response()