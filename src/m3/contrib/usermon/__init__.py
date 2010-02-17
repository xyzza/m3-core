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
                request_count - количество запросов
                request_sum_time_load - суммарное время обработки запросов
                request_sum_time_load - начало текущего запроса
                first_request_time - время первого запроса, от которого отсчитывается интервал до сохранения
                     информации о средних показателях
                     
               last_user_activity - определяется в _flush - время последней активности пользователя 
                   (не меньше определенного значения)
            '''
            self.request_count = 0
            self.request_sum_time_load = 0
            self.last_request_time = datetime.now()  
            self.first_request_time = datetime.now()
            #self.last_user_activity = datetime.now()
            
        def request_end_processing(self):
            '''
            Сохраняет среднее значение
            '''
            self.request_sum_time_load += self._get_deltatime()

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
            self.request_count += 1
            self.last_request_time = datetime.now()
        
        def _flush(self, user):
            '''
            Заносит информацию в бд и обнуляет единственный экземпляр класса
            '''
            dt_user_activity = 60 # Период добавления информации об активности пользователей, в секундах (по умолчанию 60 = 1 минута)
            if not hasattr(self, 'last_user_activity') or (datetime.now() - self.last_user_activity).seconds > dt_user_activity:
                # добавление записей в UserActivity 
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
                req_activity.total_requests = self.request_count
                req_activity.avg_request_time = round(self.request_sum_time_load / self.request_count)
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
        if get_user(request).is_authenticated(): # актуально только для аутентифицированных пользователей
            try:
                mon = MonitoringController()
                mon.add_request_stat(get_user(request))
            except:
                pass    
#        import time # тесты
#        time.sleep(1)
        return None
    
    def process_response(self, request, response):
        if get_user(request).is_authenticated():
            try:
                mon = MonitoringController()
                mon.request_end_processing()
            except:
                pass
        
##     тесты
#        pr = 'сумма времени обработки запросов: %s <br> \
#            время обработки последнего запроса:%s  <br> \
#            кол-ва запросов всего:%s <br> \
#            среднее (сумма/кол-во): %s <br> \
#            округленное cреднее:%s <br> \
#            осталось до записи(req_activity): %s <br> \
#            (user_activity): %s' \
#            % (mon.request_sum_time_load, 
#               mon._get_deltatime(), 
#               mon.request_count,
#               mon.request_sum_time_load / mon.request_count,
#               round(mon.request_sum_time_load / mon.request_count),
#               15*60 - (datetime.now() - mon.first_request_time).seconds,
#               60 - (datetime.now() - mon.last_user_activity).seconds
#               )
#        return HttpResponse(pr)
        return response