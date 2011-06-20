#coding:utf-8
from m3.contrib.ssacc_client.exceptions import SSACCException
from m3.contrib.ssacc_client.result_params import (MetaParameter,
    MetaParameterTypeEnum, MetaParameterListItem, LicenseMetaObject)
from m3.contrib.ssacc_client.results import (OperationResult, ProfileMetaResult,
    LicenseMetaResult, OperatorResult)
from m3.core.plugins import extension_point

__author__ = 'Excinsky'

################################################################################
#Additional functions
################################################################################

def profile_meta_response():
    """
    Результат получения метаинформации о создании профиля.
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

def check_profile_params(kwargs):
    """
    Проверяет пришедшие параметры для изменения профилей.

    @param kwargs: список параметров
    @param kwargs: dict (probably of lists)

    @return: None
    """
    login = kwargs.get('login')
    if not login:
        raise SSACCException('Не указан логин оператора системы')
    login = login[0]
    account_id = kwargs.get('account_id')
    if not account_id:
        raise SSACCException('Не указан строковый идентификатор SaaS аккаунта')
    account_id = account_id[0]
    enc_password = kwargs.get('enc_password')
    is_enc_pass_wrong = False
    if enc_password:
        pass_as_list = enc_password[0].split('$')
        if len(pass_as_list) != 3:
            is_enc_pass_wrong = True
    else:
        is_enc_pass_wrong = True
    if is_enc_pass_wrong:
        raw_password = kwargs.get('raw_password')
        if not raw_password:
            raise SSACCException('Не указан ни один из паролей')
        raw_password = raw_password[0]

################################################################################
#Default extension points
################################################################################

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
    return profile_meta_response()

@extension_point(name='ssacc-operator-meta')
def ssacc_operator_meta(*args, **kwargs):
    """
    Начальная точка расширения для вьюхи метаинформации о создании оператора
    профиля.

    Args:
        *args, **kwargs: Без них точки расширения не работают.
    """
    return profile_meta_response()

@extension_point(name='ssacc-license-meta')
def ssacc_license_meta(*args, **kwargs):
    """
    Начальная точка расширения для вьюхи метаинформации о лицензировании профиля

    Args:
        *args, **kwargs: Без них точки расширения не работают.
    """
    obj1 = LicenseMetaObject('obj_code', 'obj_name')
    obj2 = LicenseMetaObject('obj_code2', 'obj_name2')
    return LicenseMetaResult(obj1, obj2).return_response()

@extension_point(name='ssacc-operator-exists')
def ssacc_operator_exists(*args, **kwargs):
    """
    Начальная точка расширения для вьюхи проверки существования пользователя
    прикладного сервиса.

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    login = kwargs.get('login')
    if not login:
        raise SSACCException('Не указан логин оператора системы')

    if isinstance(login, list):
        login = login.pop()

    return OperatorResult('some_account', u'Шпатель Филателий Николаевич',
        login).return_response()

@extension_point(name='ssacc-profile-new')
def ssacc_profile_new(*args, **kwargs):
    """
    Точка расширения для вьюхи добавления администратора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    check_profile_params(kwargs)

    return OperationResult().return_response()

@extension_point(name='ssacc-profile-edit')
def ssacc_profile_edit(*args, **kwargs):
    """
    Точка расширения для вьюхи изменения администратора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    check_profile_params(kwargs)

    return OperationResult().return_response()

@extension_point(name='ssacc-operator-new')
def ssacc_operator_new(*args, **kwargs):
    """
    Точка расширения для вьюхи добавления нового оператора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    check_profile_params(kwargs)

    return OperationResult().return_response()

@extension_point(name='ssacc-operator-edit')
def ssacc_operator_edit(*args, **kwargs):
    """
    Точка расширения для вьюхи изменения администратора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    check_profile_params(kwargs)

    return OperationResult().return_response()


@extension_point(name='ssacc-profile-delete')
def ssacc_profile_delete(*args, **kwargs):
    """
    Точка расширения для вьюхи удаления администратора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    account_id = kwargs.get('account_id')
    if not account_id:
        raise SSACCException('Не задан account_id')
    account_id = account_id.pop()

    return OperationResult().return_response()

@extension_point(name='ssacc-operator-delete')
def ssacc_operator_delete(*args, **kwargs):
    """
    Точка расширения для вьюхи удаления оператора профиля

    Args:
        *args: Без него точка расширения не работает.
        **kwargs: Список POST параметров, пришедших вместе с запросом.
    """
    account_id = kwargs.get('account_id')
    if not account_id:
        raise SSACCException('Не задан account_id')
    account_id = account_id.pop()

    return OperationResult().return_response()
