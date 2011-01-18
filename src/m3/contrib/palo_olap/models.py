#coding:utf-8

from django.db import models
from django.contrib.auth.models import User


class UserMap(models.Model):
    user = models.ForeignKey(User)
    palo_user = models.ForeignKey('PaloUser')
    class Meta:
        db_table = 'palo_user_map'
    

class PaloAccount(models.Model):
    '''
    профайлы (подключения к пало серверу)
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80)
    password = models.CharField(max_length=80)
    connection = models.ForeignKey('PaloConnection')
    user = models.ForeignKey('PaloUser')
    
    class Meta:
        db_table = 'palo_accounts'

class PaloConnection(models.Model):
    '''
    подключения к olap серверу
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80)
    host = models.CharField(max_length=255)
    service = models.CharField(max_length=255)
    type = models.IntegerField()
    description = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'palo_connections'
        
class PaloGroup(models.Model):
    '''
    группы
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'palo_groups'

class PaloReport(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=255)
    owner = models.ForeignKey('PaloUser', db_column='owner')
    
    class Meta:
        db_table = 'palo_reports'

class PaloFolder(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80, unique=True)
    owner = models.ForeignKey('PaloUser', db_column='owner')
    type = models.IntegerField(null=False)
    
    class Meta:
        db_table = 'palo_folders'

class PaloRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=255)
    rights = models.CharField(max_length=10)
    
    class Meta:
        db_table = 'palo_roles'

class PaloView(models.Model):
    '''
    отчеты
    '''
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80)
    owner = models.ForeignKey('PaloUser', db_column='owner')
    definition = models.TextField()
    database_id = models.CharField(max_length=255)
    cube_id = models.CharField(max_length=255)
    account = models.ForeignKey('PaloAccount')

    class Meta:
        db_table = 'palo_views'

class PaloUser(models.Model):
    '''
    пользователи
    '''
    id = models.AutoField(primary_key=True)
    firstname = models.CharField(max_length=80)
    lastname = models.CharField(max_length=80)
    login = models.CharField(max_length=80, unique=True)
    password = models.CharField(max_length=80)#base64 md5
    
    class Meta:
        db_table = 'palo_users'

class PaloGroupRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    group = models.ForeignKey('PaloGroup')
    role = models.ForeignKey('PaloRole')
    
    class Meta:
        db_table = 'palo_groups_roles_association'

class PaloReportRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    report = models.ForeignKey('PaloReport')
    role = models.ForeignKey('PaloRole')
    
    class Meta:
        db_table = 'palo_reports_roles_association'

class PaloReportView(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    report = models.ForeignKey('PaloReport')
    view = models.ForeignKey('PaloView')
    
    class Meta:
        db_table = 'palo_reports_views_association'

class PaloUserGroup(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('PaloUser')
    group = models.ForeignKey('PaloGroup')
    
    class Meta:
        db_table = 'palo_users_groups_association'
        
class PaloUserRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('PaloUser')
    role = models.ForeignKey('PaloRole')
    
    class Meta:
        db_table = 'palo_users_roles_association'
        
class PaloViewRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    view = models.ForeignKey('PaloView')
    role = models.ForeignKey('PaloRole')
    
    class Meta:
        db_table = 'palo_views_roles_association'
        
class PaloFolderRole(models.Model):
    '''
    
    '''
    id = models.AutoField(primary_key=True)
    folder = models.ForeignKey('PaloFolder')
    role = models.ForeignKey('PaloRole')
    
    class Meta:
        db_table = 'palo_folders_roles_association'
        
        
class PaloRepositoryFolder(models.Model):
    '''
    
    '''
    user = models.AutoField(primary_key=True)
    folder= models.TextField()
    
    class Meta:
        db_table = 'palo_repository_folders'
        
