#coding:utf-8
#from django.http import HttpResponse
from django.contrib.auth import get_user
from datetime import datetime 
from .models import UserActivity, RequestActivity
'''
Набор инструкций, предназначенных для механизма мониторинга активности пользователей

@author: telepenin
date created: 16.02.10
'''

class MonitoringController(object):
    '''
    Используемый паттерн -  Singleton
    Накапливает информацию об активности пользователей, 
    количестве запросов и выполняет запись в БД 
    '''
    # Один уникальный экземпляр
    _instance = None
            
    ## Класс используется с Python singleton design pattern
    # Необходимо добавить все переменные и методы внутрь интерфейса Singleton
    class Singleton:
        
        def __init__(self):
            '''
                auth_request_count - количество запросов от аутентифицированных пользователей
                anon_request_count - от анонимов
                
                auth_request_sum_time_load - суммарное время обработки запросов от аутентифицированных пользователей
                anon_request_sum_time_load - от анонимов
                
                first_request_time - время первого запроса, от которого отсчитывается интервал до сохранения
                     информации о средних показателях
                     
               last_user_activity - определяется в _flush - время последней активности пользователя 
                   (не меньше определенного значения)
            '''
            self.auth_request_count = 0
            self.anon_request_count = 0
            
            self.auth_request_sum_time_load = 0
            self.anon_request_sum_time_load = 0
            
            self.last_request_time = datetime.now()  
            self.first_request_time = datetime.now()
            #self.last_user_activity = datetime.now()
            
        def request_end_processing(self, user):
            '''
            Сохраняет среднее значение
            '''
            if user.is_authenticated():
                self.auth_request_sum_time_load += self._get_deltatime()
            else:
                self.anon_request_sum_time_load += self._get_deltatime()

        def _get_deltatime(self):
            '''
            Возвращает разность между текущей датой и последним запросом (в милисекундах)
            '''
            dt = datetime.now() - self.last_request_time
            return dt.seconds*10**3 + dt.microseconds*10**-3
        
        def add_request_stat(self, user):
            '''
            Фиксирует запрос в экземпляре
            '''
            self._flush(user) # может быть уже пора сделать сохранение в базу?
            if user.is_authenticated():
                self.auth_request_count += 1
            else: 
                self.anon_request_count += 1
            
            self.last_request_time = datetime.now()
        
        def _flush(self, user):
            '''
            Заносит информацию в бд и обнуляет единственный экземпляр класса
            '''
            if user.is_authenticated():
                dt_user_activity = 60 # Период добавления информации об активности пользователей, в секундах (по умолчанию 60 = 1 минута)
                if not hasattr(self, 'last_user_activity') or (datetime.now() - self.last_user_activity).seconds > dt_user_activity:
                    # добавление записей в UserActivity 
                    
                    if UserActivity.objects.filter(user_id=user).count() == 1 :
                        user_activity = UserActivity.objects.get(user_id=user)
                    elif UserActivity.objects.filter(user_id=user).count() > 1:
                        UserActivity.objects.filter(user_id=user).delete()
                        user_activity = UserActivity()
                    else:
                        user_activity = UserActivity()
                    
                    user_activity.user_id = user
                    user_activity.save()    
                    
                    self.last_user_activity = datetime.now()       
            
            dt_req_activity = 15*60 # Период добавления информации о средних показателях, в секундах (по умолчанию 15*60 = 15 минут)
            if self.first_request_time and (datetime.now() - self.first_request_time).seconds > dt_req_activity: # нужно записать информацию в б
                # добавление в RequestActivity
                req_activity = RequestActivity()
                req_activity.period = datetime(datetime.now().year, 
                                               datetime.now().month, 
                                               datetime.now().day, 
                                               datetime.now().hour,
                                               datetime.now().minute,
                                               datetime.now().second,)
                # Аутентифицированные:
                req_activity.total_requests = self.auth_request_count
                if self.auth_request_count:
                    req_activity.avg_request_time = round(self.auth_request_sum_time_load / self.auth_request_count)
                else:
                    req_activity.avg_request_time = 0
                
                # Анонимы:
                req_activity.a_total_requests = self.anon_request_count
                if self.anon_request_count:
                    req_activity.a_avg_request_time = round(self.anon_request_sum_time_load / self.anon_request_count)
                else:
                    req_activity.a_avg_request_time = 0
                
                #req_activity.request_type = None # Пока не трогаем это поле
                req_activity.save()
                
                # очищаем текущий экземпляр, достаточно заново проинициализировать
                self.__init__()

    def __init__(self):
        # Проверка на существование экземпляра
        if MonitoringController._instance is None:
            # Создание экземпляра, если не существует
            MonitoringController._instance = MonitoringController.Singleton()
 
        # Ссылка на единственный экземпляр 
        # self._EventHandler_instance = MonitoringController._instance
 
    # Передает доступ к реализации синглтона
    def __getattr__(self, aAttr):
        return getattr(self._instance, aAttr)
 
    # Передает доступ к реализации синглтона
    def __setattr__(self, aAttr, aValue):
        return setattr(self._instance, aAttr, aValue)


class UsermonMiddleware:
    '''
     Запоминает текущий запрос/ответ в единственном экземпляре MonitoringController
    '''
    
    def process_request(self, request):
        try:
            mon = MonitoringController()
            mon.add_request_stat(get_user(request))
        except:
            pass    
#        import time # тесты
#        time.sleep(1)
        return None
    
    def process_response(self, request, response): 
        try:
            mon = MonitoringController()
            mon.request_end_processing(get_user(request))
        except:
            pass
        
##     тесты
#        if mon.auth_request_count:
#            avg =round(mon.auth_request_sum_time_load / mon.auth_request_count)
#        else:
#            avg = 0
#        
#        if mon.anon_request_count:
#            a_avg = round(mon.anon_request_sum_time_load / mon.anon_request_count)
#        else: 
#            a_avg = 0
#            
#        if hasattr(mon, 'last_user_activity'):
#            last_user_activity = mon.last_user_activity
#        else:
#            last_user_activity = datetime.now()
#            
#        pr = 'сумма времени обработки запросов аутент.: %s - анонимы: %s<br> \
#            время обработки последнего запроса:%s  <br> \
#            среднее (сумма/кол-во) аутент: %s  анонимы: %s<br> \
#            округленное cреднее:%s <br> \
#            осталось до записи(req_activity): %s <br> \
#            (user_activity): %s' \
#            % (mon.auth_request_sum_time_load, mon.anon_request_sum_time_load,
#               mon._get_deltatime(), 
#               mon.auth_request_count,
#               avg, a_avg,
#               20 - (datetime.now() - mon.first_request_time).seconds,
#               10 - (datetime.now() - last_user_activity).seconds
#               )
#        return HttpResponse(pr)
        return response