#coding:utf-8

from django.db import models 
from django.contrib.auth.models import User

class UserActivity(models.Model):
    '''
    Активность пользователей
       user_id - id пользователя
       last_request - последний запрос  
    '''
    user_id =  models.ForeignKey(User)
    last_request = models.DateTimeField(auto_now = True)
    
    class Meta:
        db_table = 'm3_usermon_activity'
        
        
class RequestActivity(models.Model):
    '''
    Среднее время обработки запроса
        period - конец отчетного периода
        avg_request_time - среднее время запроса
        total_requests - всего запросов
        request_type - тип запроса (версия 0.2 - всегда пустое)
    '''
    period = models.DateTimeField()
    avg_request_time = models.IntegerField() # в милисекундах
    total_requests = models.IntegerField()
    request_type = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        db_table = 'm3_usermon_requests'