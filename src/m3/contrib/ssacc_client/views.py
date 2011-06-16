#coding:utf-8
from m3.core.plugins import ExtensionManager
#Насильный импорт, чтобы заработали декораторы
import m3.contrib.ssacc_client.api

__author__ = 'Excinsky'

def ssacc_ping(request):
    """
    Вьюшка пустого запроса.
    """
    return ExtensionManager().execute('ssacc-ping')

def ssacc_profile_meta(request):
    """
    Вьюшка метаинформации о создании профиля.
    """
    return ExtensionManager().execute('ssacc-profile-meta')
