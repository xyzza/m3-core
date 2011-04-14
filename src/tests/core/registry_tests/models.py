#coding:utf-8
'''
Created on 12.04.2011

@author: akvarats
'''

from django.db import models

class RegisterDayModel(models.Model):
    '''
    Модель хранения записей регистра
    '''
    date = models.DateField()
    
    # измерения
    dim1 = models.CharField(max_length=100)
    dim2 = models.IntegerField()
    dim3 = models.CharField(max_length=30)
    
    # ресурсы накопления
    rest1 = models.DecimalField(max_digits=16, decimal_places=4)
    rest2 = models.DecimalField(max_digits=16, decimal_places=4)
    
    # ресурсы оборотов
    circ1 = models.DecimalField(max_digits=16, decimal_places=4)
    circ2 = models.DecimalField(max_digits=16, decimal_places=4)    
    