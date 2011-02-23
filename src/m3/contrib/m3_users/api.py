#coding:utf-8
'''
Внешнее API для подсистемы m3_users

Created on 09.12.2010

@author: akvarats
'''

from django.contrib.auth import models as auth_models

from django.db import transaction

from helpers import get_assigned_metaroles_query
from metaroles import get_metarole

from m3.db.api import get_object_by_id

import models

def get_user_metaroles(user):
    '''
    Возвращает объекты метаролей, которые есть у пользователя.
    '''
    result = []
    for metarole_code in get_assigned_metaroles_query(user):
        metarole = get_metarole(metarole_code)
        if metarole:
            result.append(metarole)
    
    return result

def user_has_metarole(user, metarole):
    '''
    Возвращает True в случае, если пользователю user назначена
    метароль metarole.
    
    @param user: пользователь, для которого проверяется наличие метароли
    @param metarole: строковый код проверяемой метароли 
    '''
    for metarole_code in get_assigned_metaroles_query(user):
        if metarole_code == metarole:
            return True
    return False


def get_user_roles(user):
    '''
    Возвращает список ролей пользователя
    '''
    return models.UserRole.objects.filter(assigned_users__user=user).order_by('name')


def remove_user_role(user, role):
    '''
    Снимает роль у пользователя
    '''
    models.AssignedRole.objects.filter(user=user, role=role).delete()
    
def set_user_role(user, role):
    '''
    Устанавливает роль для пользователя
    '''
    if len(models.AssignedRole.objects.filter(user=user, role=role)[0:1]) == 0:
        
        if isinstance(role, int):
            role = models.UserRole.objects.get(id=role)
            
        if isinstance(user, int):
            user = auth_models.User.objects.get(id=user)
        
        assigned_role = models.AssignedRole()
        assigned_role.user = user
        assigned_role.role = role
        assigned_role.save()
        
def clear_user_roles(user):
    '''
    Убирает все роли у пользователя
    '''
    models.AssignedRole.objects.filter(user=user).delete()
    
    
def get_user_by_id(user_id):
    '''
    Возвращает экземпляр пользователя (auth.User) по указанному идентификатору.
    
    В случае, если вдруг в user_id передан реальный пользователь, то
    он и возвращается.
    '''
    return get_object_by_id(auth_models.User, user_id)