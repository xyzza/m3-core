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

def ssacc_operator_meta(request):
    """
    Вьюшка метаинформации о создании профиля.
    """
    return ExtensionManager().execute('ssacc-operator-meta')

def ssacc_license_meta(request):
    """
    Вьюшка метаинформации о лицензировании профиля.
    """
    return ExtensionManager().execute('ssacc-license-meta')

def ssacc_operator_exists(request):
    """
    Вьюшка проверки существования пользователя.
    """
    return ExtensionManager().execute('ssacc-operator-exists',
        **request.POST)

def ssacc_profile_new(request):
    """
    Вьюшка добавления администратора профиля.
    """
    return ExtensionManager().execute('ssacc-profile-new',
        **request.POST)

def ssacc_profile_edit(request):
    """
    Вьюшка изменения администратора профиля.
    """
    return ExtensionManager().execute('ssacc-profile-edit',
        **request.POST)

def ssacc_operator_new(request):
    """
    Вьюшка добавления администратора профиля.
    """
    return ExtensionManager().execute('ssacc-operator-new',
        **request.POST)

def ssacc_operator_edit(request):
    """
    Вьюшка изменения администратора профиля.
    """
    return ExtensionManager().execute('ssacc-operator-edit',
        **request.POST)

def ssacc_profile_delete(request):
    """
    Вьюшка удаления администратора профиля.
    """
    return ExtensionManager().execute('ssacc-profile-delete',
        **request.POST)

def ssacc_operator_delete(request):
    """
    Вьюшка удаления оператора профиля.
    """
    return ExtensionManager().execute('ssacc-operator-delete',
        **request.POST)