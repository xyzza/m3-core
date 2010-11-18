#coding:utf-8

from django.db import models

class UserActivity(models.Model):
    """
    Активность пользователей
    """
    # Имя пользователя на текущий момент
    user_name = models.CharField(max_length=30, blank=True, null=True)
    # id пользователя на текущий момент
    user_id =  models.PositiveIntegerField()
    # Время последнего запроса
    last_request = models.DateTimeField(auto_now = True)
    
    class Meta:
        db_table = 'm3_usermon_activity'
        
        
class RequestActivity(models.Model):
    """
    Среднее время обработки запроса
    """
    # Конец отчетного периода?
    period = models.DateTimeField()
    # Среднее время запроса, мс
    avg_request_time = models.IntegerField(default=0)
    # Всего запросов
    total_requests = models.IntegerField(default=0)
    # Всего запросов от ананимусов, мс
    a_avg_request_time = models.IntegerField(default=0)
    # Всего запросов от ананимусов
    a_total_requests = models.IntegerField(default=0)
    # Тип запроса (версия 0.2 - всегда пустое) х.з. зачем оно?
    request_type = models.CharField(max_length=200, blank=True, null=True)
    # Запрашиваемый адрес
    url = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        db_table = 'm3_usermon_requests'