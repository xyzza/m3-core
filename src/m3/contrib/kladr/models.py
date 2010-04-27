#coding:utf-8

from django.db import models

class KladrGeo(models.Model):
    '''
    Справочник КЛАДР
    '''
    parent = models.ForeignKey('KladrGeo', null=True, blank=True)
    name = models.CharField(max_length=40)
    socr = models.CharField(max_length=10)
    code = models.CharField(max_length=13)
    zipcode = models.CharField(max_length=6)
    gni = models.CharField(max_length=4)
    uno = models.CharField(max_length=4)
    okato = models.CharField(max_length=11)
    status = models.CharField(max_length=1)
    
class KladrStreet(models.Model):
    '''
    Справочник КЛАДР (улицы)
    ''' 
    parent = models.ForeignKey('KladrGeo', null=True, blank=True)
    name = models.CharField(max_length=40)
    socr = models.CharField(max_length=10)
    code = models.CharField(max_length=17)
    zipcode = models.CharField(max_length=6)
    gni = models.CharField(max_length=4)
    uno = models.CharField(max_length=4)
    okato = models.CharField(max_length=11)