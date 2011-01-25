#coding:utf-8
'''
Базовые-и-не-только модели для подсистемы аудита

Created on 17.12.2010

@author: akvarats
'''

from django.db import models
from django.core import serializers
from django.contrib.auth.models import User, AnonymousUser
from manager import AuditManager


class BaseAuditModel(models.Model):
    '''
    Базовая модель, от которой наследуются все 
    модели хранения результатов аудита
    '''
    
    # данные пользователя. специально не делается ForeignKey.
    # чтобы не быть завязанными на ссылочную целостность
    # * логин пользователя в системе (на момент записи значения
    username = models.CharField(max_length=50, null=True, blank=True, db_index=True, default=u'')
    # * идентификатор пользователя
    userid = models.PositiveIntegerField(default=0, db_index=True)
    # * ФИО пользователя на момент записи значения (для ускоренного отображения 
    #   значений
    user_fio = models.CharField(max_length=70, null=True, blank=True, db_index=True, default=u'')
    # * дополнительные сведения о пользователе (например, сотрудником какого 
    #   учреждения он являлся на момент записи
    user_info = models.CharField(max_length=200, null=True, blank=True, default=u'')
    
    # серверный таймстамп на запись аудита
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        abstract = True
        
    def by_user(self, user):
        '''
        Заполняет значения полей моделей на основе переданного пользователя
        '''
        if isinstance(user, User):
            self.username = user.username
            self.userid = user.id  
            self.user_fio = (user.first_name + ' ' + user.last_name).strip()
        elif isinstance(user, AnonymousUser):
            self.username = 'anonymous'
            self.userid = 0
            self.user_fio = u'<Анонимный пользователь>'

    
class BaseModelChangeAuditModel(BaseAuditModel):
    '''
    Аудит, предназначенный для отслеживания изменений в моделях системы
    '''
    
    #===========================================================================
    # Типы операций над моделью
    #===========================================================================
    ADD = 0
    EDIT = 1
    DELETE = 2
    
    # Данные модели, для которой был выполнен аудит
    # * идентификатор объекта (специально не храним FK, чтобы была возможность
    #   безболезненно удалять объекты
    object_id = models.PositiveIntegerField(default=0, db_index=True)
    object_model = models.CharField(max_length=300, db_index=True)
    # данные модели, на момент  
    object_data = models.TextField()
    
    type = models.PositiveIntegerField(choices=((ADD, u'Добавлене'),
                                                (EDIT, u'Изменение'),
                                                (DELETE, u'Удаление'),),
                                       db_index=True)
    
    @classmethod
    def write(cls, user, model_object, type, *args, **kwargs):
        
        audit = cls()
        audit.by_user(user)
        
        if (type == BaseModelChangeAuditModel.ADD or 
            type == 'add' or type == 'new'):
            audit.type = BaseModelChangeAuditModel.ADD
            
        elif (type == BaseModelChangeAuditModel.EDIT or
              type == 'edit'):
            audit.type = BaseModelChangeAuditModel.EDIT
            
        elif (type == BaseModelChangeAuditModel.DELETE or
              type == 'remove' or
              type == 'delete'):
            audit.type = BaseModelChangeAuditModel.DELETE
            
        audit.object_id = model_object.id if model_object.id else 0
        audit.object_model = (model_object.__class__.__module__ + 
                              '.' + 
                              model_object.__class__.__name__)
        try:
            audit.object_data = serializers.serialize('json', [model_object,])
        except:
            pass
        audit.save()
    
    class Meta:
        abstract = True


#===============================================================================
# Общий аудит для сохранения информации об изменении моделей
#===============================================================================
class DefaultModelChangeAuditModel(BaseModelChangeAuditModel):
    '''
    Модель дефолтного аудита изменения моделей
    '''
    
    class Meta:
        db_table = 'm3_audit_model_changes'
        
AuditManager().register('model-changes', DefaultModelChangeAuditModel)        
#===============================================================================
# Аудит для сохранения информации об изменении записей справочников
#===============================================================================
class DictChangesAuditModel(BaseModelChangeAuditModel):
    '''
    Модель аудита изменения в справочниках
    '''
    
    class Meta:
        db_table = 'm3_audit_dict_changes'

AuditManager().register('dict-changes', DictChangesAuditModel) 
#===============================================================================
# Преднастроенный аудит для входов/выходов пользователей из системы
#===============================================================================
class AuthAuditModel(BaseAuditModel):
    '''
    Аудит входов/выходов пользователя из системы
    '''
    #===========================================================================
    # Тип авторизации пользователя
    #===========================================================================
    LOGIN = 0
    LOGOUT = 1
    
    type = models.PositiveIntegerField(choices=((LOGIN, u'Вход в систему'),
                                                (LOGOUT, u'Выход из системы'),), 
                                       db_index=True)
    
    @classmethod
    def write(cls, user, type='login', *args, **kwargs):
        '''
        Пишем информацию об аудите входа/выхода
        '''
        audit = AuthAuditModel()
        audit.by_user(user)
        audit.type = AuthAuditModel.LOGIN if type == 'login' else AuthAuditModel.LOGOUT
        audit.save()
    
    class Meta:
        db_table = 'm3_audit_auth'

AuditManager().register('auth', AuthAuditModel)