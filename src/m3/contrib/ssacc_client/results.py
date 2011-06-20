#coding:utf-8
from xml.dom.minidom import Element
from django.http import HttpResponse

from xml.dom import minidom
from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.result_params import (MetaParameter,
    LicenseMetaObject, ProfileRatesParam)

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

        @return HttpResponse
        """
        self._get_result_node().setAttribute('status', 'ok')
        return HttpResponse(content=self._get_xml_content(),
            mimetype='text/xml')

    @staticmethod
    def _get_nodes_from_xml(xml_string):
        """
        @static
        Возвращает элементы с тегом result из пришедшей строки.

        @param xml_string: XML строка
        @type xml_string: str
        """
        document = minidom.parseString(xml_string)
        result_nodes = document.getElementsByTagName('result')
        if not len(result_nodes):
            raise SSACCException(u'Ошибка преобразования из xml, формат не '
                u'поддерживается SSACC')

        return result_nodes

    @staticmethod
    def is_result_ok(xml_string):
        """
        Проверяет, является ли XML строка ошибочной, или же успешной/

        @param xml_string: ХМЛ строка
        @type xml_string: str
        """
        result_nodes = BaseResult._get_nodes_from_xml(xml_string)
        result_node = result_nodes.pop()
        result_status_attribute = result_node.getAttribute('status')

        return result_status_attribute == 'ok'

    @staticmethod
    def parse_xml_to_result(xml_string, result_type):
        """
        @static
        Преобразовывает XML строку в подходящий враппер.

        @param xml_string: XML строка.
        @type xml_string: str

        @raise SSACCException, если не удалось преобразовать строку в один из
            форматов SSACC
        @return OperationResult or ErrorResult
        """
        result_nodes = BaseResult._get_nodes_from_xml(xml_string)
        result_node = result_nodes[0]

        if result_type == OperationResult:
            return OperationResult()
        elif result_type == ErrorResult:
            message = result_node.getAttribute('message')
            code = result_node.getAttribute('error_code')
            return ErrorResult(message, code)
        elif result_type == ProfileRatesResult:
            # TODO(Excinsky): Не совсем эффективно, так как идет сначала
            # распарсивание, а потом снова запарсивание.
            params_list = []
            for param in result_node.getElementsByTagName('param'):
                param_code = param.getAttribute('code')
                param_min_value = param.getAttribute('min_value')
                param_max_value = param.getAttribute('max_value')
                params_list.append(ProfileRatesParam(param_code,
                    param_min_value, param_max_value))

            return ProfileRatesResult(*params_list)

        elif result_type == AvailabilityResult:
            availability = result_node.getElementsByTagName(
                'availability').pop()
            status = availability.getAttribute('status')
            message = availability.getAttribute('message')

            return AvailabilityResult(status, message)

        raise SSACCException(u'Неверный тип результата')


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
    pass


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
        self._param_list = args
        self._init_param_nodes()

    def _init_param_nodes(self):
        """
        Превращает пришедший список параметров ответа в список xml.dom.Element

        @return: None
        """
        for param in self._param_list:
            if isinstance(param, MetaParameter):
                node = self._create_xml_response_node('param')
                self._prepare_node_from_meta_param(node, param)
                self._get_result_node().appendChild(node)


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


class LicenseMetaResult(BaseResult):
    """
    Облегающий класс над ответом на запрос метаинформации для создания профиля.
    """
    def __init__(self, *args):
        """
        @param args: Список объектов параметров.
        @type args: Список объектов параметров.
        """
        super(LicenseMetaResult, self).__init__()

        self._object_list = args
        self._init_object_nodes()

    def _init_object_nodes(self):
        """
        Превращает пришедший список объектов лицензирования в список
        xml.dom.Element

        @return: None
        """
        for obj in self._object_list:
            if isinstance(obj, LicenseMetaObject):
                node = self._create_xml_response_node('object')
                self._prepare_node_from_object(node, obj)
                self._get_result_node().appendChild(node)

    def _prepare_node_from_object(self, node, obj):
        node.setAttribute('code', obj.get_code())
        node.setAttribute('name', obj.get_name())
        node.setAttribute('type', obj.get_type_as_string())


class OperatorResult(BaseResult):
    """
    Облегающий класс над ответом на запрос проверки существования пользователя.
    """
    def __init__(self, account_id, username, login):
        """
        @param account_id: Строковый идентификатор SaaS аккаунта.
        @type account_id: str
        @param username: Название пользователя прикладного сервиса.
        @type username: str
        @param login: Логин пользователя прикладного сервиса.
        @type login: str
        """
        super(OperatorResult, self).__init__()

        self._account_id = account_id
        self._username = username
        self._login = login

    def return_response(self):
        operator_node = Element('operator')
        operator_node.setAttribute('account_id', self._account_id)
        operator_node.setAttribute('username', self._username)
        operator_node.setAttribute('login', self._login)

        self._get_result_node().appendChild(operator_node)

        return super(OperatorResult, self).return_response()


class ProfileRatesResult(BaseResult):
    """
    Облегающий класс над ответом на запрос о тарифном плане аккаунта.
    """
    def __init__(self, *args):
        """
        @param args: Список параметров.
        @type args: ProfileRatesParam.
        """
        super(ProfileRatesResult, self).__init__()
        self._param_list = args

        self._init_param_nodes()

    def _init_param_nodes(self):
        """
        Превращает пришедший список параметров ответа в список xml.dom.Element

        @return: None
        """
        for param in self._param_list:
            if isinstance(param, ProfileRatesParam):
                node = self._create_xml_response_node('param')
                self._prepare_node_from_meta_param(node, param)
                self._get_result_node().appendChild(node)

    def _prepare_node_from_meta_param(self, node, param):
        """
        Подготавливает xml.dom.Element из result_params.ProfileRatesParam

        @param node: xml.dom.Element
        @param param: result_params.MetaParameter
        @return: None.
        """
        node.setAttribute('code', param.get_code())
        node.setAttribute('min_value', param.get_min_value())
        node.setAttribute('max_value', param.get_max_value())


class AvailabilityResult(BaseResult):
    """
    Облегающий класс над ответом на запрос о проверке возможности использования
    """
    def __init__(self, status, message=''):
        """
        @param status: Статус доступности.
        @type status: str.
        @param message: Сообщение о причине недоступности, если оно присутствует.
        @type message: str.
        """
        super(AvailabilityResult, self).__init__()

        self._status = status
        self._message = message

    def return_response(self):
        availability_node = Element('availability')
        availability_node.setAttribute('status', self._status)
        if self._status == '0':
            availability_node.setAttribute('message', self._message)

        self._get_result_node().appendChild(availability_node)

        return super(AvailabilityResult, self).return_response()

