#coding:utf-8
from m3.core.plugins import ExtensionManager
#Насильный импорт, чтобы заработали декораторы
import m3.contrib.ssacc_client.api

__author__ = 'Excinsky'

def ssacc_ping(request):
    return ExtensionManager().execute('ssacc-ping')

def ssacc_ping2(request):
    return ExtensionManager().execute('ssacc-ping2')
