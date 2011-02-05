# -*- coding: utf-8 -*-

from models import UserMap, PaloUser, PaloAccount, PaloUserGroup, PaloGroup, PaloConnection
from m3.contrib.m3_users.helpers import get_assigned_metaroles_query
from m3.contrib.m3_users import ADMIN, SUPER_ADMIN
#TODO: надо перенести метароль в пало реадктор олап отчетов
import base64
import hashlib
PALO_EDITOR = 'palo_editor'

class UserMapper(object):
    @classmethod
    def get_user_group(cls, user):
        '''
        возвращает группу которая должна быть у пользователя
        name из таблицы palo_group
        '''
        meta_roles = get_assigned_metaroles_query(user)
        if ADMIN in meta_roles or SUPER_ADMIN in meta_roles:
            #админ однако
            return 'admin'
        elif PALO_EDITOR in meta_roles:
            return 'editor'
        else:
            return 'viewer'
         

    @classmethod
    def get_palo_user(cls, user):
        group = cls.get_user_group(user)
        if group == 'viewer':
            #только просмотр возьмем стандартного пользователя
            try:
                return PaloUser.objects.get(login='viewer')
            except PaloUser.DoesNotExist:
                raise Exception(u'Не удалось найти пользователя с login = viewer')
        try:
            return UserMap.objects.get(user=user).palo_user
        except UserMap.DoesNotExist:
            return None

    @classmethod
    def create_palo_user(cls, user, password):
        '''
        создадим пало пользователя с сылкой на него и группой
        '''
        try:
            pu = PaloUser.objects.get(login=user.username)
        except PaloUser.DoesNotExist:
            pu = PaloUser()
        pu.login = user.username
        try:
            #вдруг профайил есть с ФИО
            pu.firstname = user.get_profile().firstname
            pu.lastname = user.get_profile().lastname
        except:
            pu.firstname = ''
            pu.lastname = ''
        m = hashlib.md5()
        m.update(password)
        
        pu.password = base64.b64encode(m.digest())
        pu.save()
        
        #назначим группу
        group = PaloGroup.objects.get(name = cls.get_user_group(user))
        PaloUserGroup.objects.get_or_create(user=pu, group=group)
        
        #создадим аккаунт
        if not PaloAccount.objects.filter(user=pu).exists():
            #нет аккаунта создадим
            pa = PaloAccount()
            pa.user = pu
            pa.login = 'admin'
            pa.password = 'admin'
            pa.connection = PaloConnection.objects.get(name='Palo')
            pa.save()
        
        #создадим связь
        UserMap.objects.get_or_create(user=user, palo_user=pu)
        
        return pu
        
         
        
            
                
        