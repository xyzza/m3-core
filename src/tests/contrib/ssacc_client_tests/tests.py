#coding:utf-8
from xml.dom import minidom

from django.test.client import RequestFactory
from django.utils import unittest

from m3.contrib.ssacc_client.api import server_ssacc_ping
from m3.contrib.ssacc_client.views import ssacc_ping, ssacc_profile_meta

__author__ = 'daniil-ganiev'

class RequestsToServerTestCase(unittest.TestCase):

    def test_ServerSsaccPing_runs_noExceptions(self):
        server_ssacc_ping()

###############################################################################
#Результаты, которые запрашивает ссакосервак
###############################################################################
class BaseViewTestCase(object):
    request_address = ''

    def test_View_runs_returnsXmlMimeType(self):
        self.assertEqual(self.response._headers['content-type'][1], 'text/xml')

    def test_View_runs_statusCodeIs200(self):
        self.assertEqual(self.response.status_code, 200)

    def test_View_runs_resultStatusIsOk(self):
        document = minidom.parseString(self.response.content)
        result_nodes = document.getElementsByTagName('result')
        result_node = result_nodes[0]
        self.assertEqual(result_node.getAttribute('status'), 'ok')

    def test_View_runs_hasResultStatus(self):
        document = minidom.parseString(self.response.content)
        result_nodes = document.getElementsByTagName('result')
        self.assertNotEqual(len(result_nodes), 0)


class SsaccPingViewTestCase(BaseViewTestCase, unittest.TestCase):
    request_address = '/ssacc/ping'

    def setUp(self):
        factory = RequestFactory()
        request = factory.get(self.request_address)
        self.response = ssacc_ping(request)


class SsaccProfileMetaViewTestCase(BaseViewTestCase, unittest.TestCase):
    request_address = '/ssacc/profile/meta'

    def setUp(self):
        factory = RequestFactory()
        request = factory.get(self.request_address)
        self.response = ssacc_profile_meta(request)

    def test_View_runs_hasIntParam(self):
        document = minidom.parseString(self.response.content)
        result_nodes = document.getElementsByTagName('param')
        int_param_nodes = [node for node in result_nodes
            if node.getAttribute('type') == 'int'
            and node.getAttribute('code') == 'code1']
        self.assertEqual(len(int_param_nodes), 1)

    def test_View_runs_hasListItems(self):
        document = minidom.parseString(self.response.content)
        result_nodes = document.getElementsByTagName('param')
        list_param_nodes = [node for node in result_nodes
            if node.getAttribute('type') == 'list'
            and node.getAttribute('code') == 'code4']
        list_node = list_param_nodes[0]
        list_node_items = list_node.getElementsByTagName('item')

        self.assertEqual(len(list_node_items), 2)