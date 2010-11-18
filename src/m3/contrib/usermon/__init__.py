#coding:utf-8
"""
Мониторинг активности пользователей и статистика времени обработки запросов
"""
from datetime import datetime
from collections import defaultdict

from models import UserActivity, RequestActivity

class Stat:
    """ Содержит статистические данные за период """
    def __init__(self):
        # количество запросов от аутентифицированных пользователей                      
        self.auth_request_count = 0
        # от анонимов
        self.anon_request_count = 0
        # суммарное время обработки запросов от аутентифицированных пользователей
        self.auth_request_sum_time_load = 0
        # от анонимов
        self.anon_request_sum_time_load = 0
        
    def get_avg_request_time(self):
        return round(self.auth_request_sum_time_load / self.auth_request_count) if self.auth_request_count else 0
    
    def get_a_avg_request_time(self):
        return round(self.anon_request_sum_time_load / self.anon_request_count) if self.anon_request_count else 0


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
        # Период добавления информации о средних показателях, в секундах (по умолчанию 15*60 = 15 минут)
        DT_REQ_ACTIVITY = 15*60
        # Период добавления информации об активности пользователей, в секундах (по умолчанию 60 = 1 минута) 
        DT_USER_ACTIVITY = 60 
        
        def __init__(self):
            self.buffer = defaultdict(lambda: Stat())
            # время первого запроса, от которого отсчитывается интервал до сохранения информации о средних показателях
            self.last_request_time = datetime.now()
            # время последней активности пользователя (не меньше определенного значения)
            self.first_request_time = datetime.now()

        def _get_deltatime(self):
            '''
            Возвращает разность между текущей датой и последним запросом (в милисекундах)
            '''
            dt = datetime.now() - self.last_request_time
            return dt.seconds*10**3 + dt.microseconds*10**-3
        
        def add_request_stat(self, request):
            '''
            Фиксирует запрос в экземпляре
            '''
            user = request.user
            path = request.path
            self._flush(user) # может быть уже пора сделать сохранение в базу?
            if user.is_authenticated():
                self.buffer[path].auth_request_count += 1
            else: 
                self.buffer[path].anon_request_count += 1
            
            self.last_request_time = datetime.now()
            
        def request_end_processing(self, request):
            '''
            Сохраняет среднее значение
            '''
            user = request.user
            path = request.path
            if user.is_authenticated():
                self.buffer[path].auth_request_sum_time_load += self._get_deltatime()
            else:
                self.buffer[path].anon_request_sum_time_load += self._get_deltatime()
        
        def _flush(self, user):
            '''
            Заносит информацию в бд и обнуляет единственный экземпляр класса
            '''
            # Если пользователь авторизован, то надо записать время его активности
            if user.is_authenticated():
                if not hasattr(self, 'last_user_activity') or \
                   (datetime.now() - self.last_user_activity).seconds > self.DT_USER_ACTIVITY:

                    UserActivity.objects.get_or_create(user_id=user.id, user_name=user.username) 
                    self.last_user_activity = datetime.now()       
            
            # Записываем статистику по времени отработки запросов
            if self.first_request_time and (datetime.now() - self.first_request_time).seconds > self.DT_REQ_ACTIVITY:
                
                now = datetime.now()
                period = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second)
                for url, stat in self.buffer.items():
                    RequestActivity.objects.create(
                        url = url,
                        period = period,
                        total_requests = stat.auth_request_count,
                        a_total_requests = stat.anon_request_count,
                        # Средние показатели
                        avg_request_time = stat.get_avg_request_time(),
                        a_avg_request_time = stat.get_a_avg_request_time()
                    )
                
                # очищаем текущий экземпляр, достаточно заново проинициализировать
                self.__init__()

    def __init__(self):
        # Проверка на существование экземпляра
        if MonitoringController._instance is None:
            # Создание экземпляра, если не существует
            MonitoringController._instance = MonitoringController.Singleton()
 
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
        mon = MonitoringController()
        mon.add_request_stat(request)
    
    def process_response(self, request, response): 
        mon = MonitoringController()
        mon.request_end_processing(request)
        
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