#coding:utf-8
__author__ = 'ZIgi'

from abc import ABCMeta, abstractmethod
from threading import Thread
from m3.ui.actions import Action, ACD
from m3.ui.actions.results import ActionResult
import json
from django import http

class IBackgroundWorker(Thread):
    '''
    Класс для работы в фоновом режиме. Соответсвующие методы должны быть определены разработчиком.
    Тк класс представляет собой наследник Thread, нужно понимать что фактически при использовании
    будет создан новый тред и учитывать это при доступе к ресурсам приложения. Методы
    stop и ping должны возвращать экземпляры  AsyncOperationResult.
    Вообще говоря можно реализовать данный класс по другому, главное чтобы были определены следующие методы
    (например если есть нужда использовать мутекс на уровне нескольких инстансов приложений)
    '''
    __metaclass__ = ABCMeta

    def start(self):
        #это стандартный метод объект Thread, его трогать не нужно
        super(IBackgroundWorker, self).start()

    @abstractmethod
    def run(self):
        '''
        Метод вызывается после вызоыва метода start()
        '''
        raise NotImplementedError('Attribute run must be overrided in  child class')

    @abstractmethod
    def stop(self):
        '''
        Метод остановки операции
        '''
        raise NotImplementedError('Attribute stop must be overrided in  child class')

    @abstractmethod
    def ping(self):
        '''
        Проверка состояния
        '''
        raise NotImplementedError('Attribute ping must be overrided in  child class')

class AsyncOperationResult(ActionResult):
    def __init__(self, value = 0.0, text = '', is_active = True):
        self.value = value
        self.text = text
        self.is_active = is_active

    def get_http_response(self):
        data = json.dumps( {
            'text':self.text,
            'value':self.value,
            'isActive':self.is_active
        })
        return http.HttpResponse(data, mimetype='application/json')

class AsyncAction(Action):
    '''
    Экшен обработки запросов с клиента. В данном варианте инсанс класса воркера
    общий для всех http запросов инстанса приложения, поэтому если один пользователь начал
    фоновую операцию, все пользователи этого сервера будут видеть такой-же прогресс
    Можно с помощью словаря сессий, где бы хранились инстансы воркеров,
    реализовать для каждого пользователя свою операцию,
    или же с помощью мутексов глобальную блокировку операции на уровне приложения
    '''
    COMMAND_START = 'start'
    COMMAND_STOP = 'stop'
    COMMAND_PING = 'ping'

    worker_cls = None
    _worker_instance = None

    def __init__(self):
        super(AsyncAction, self).__init__()

    def context_declaration(self):
        return [
            ACD(name='command', type=str, required=True)
        ]

    def run(self, request, context):
        if self.worker_cls is None:
            raise NotImplementedError('Worker class in not defined')

        if context.command == self.COMMAND_START:
            return self.start_operation()
        elif context.command == self.COMMAND_STOP:
            return self.stop_operation()
        elif context.command == self.COMMAND_PING:
            return self.ping_operation()
        
    def start_operation(self):
        #если операция уже запущенна, то перезапустим
        #надо подумать насколько корректно такое поведение
        if AsyncAction._worker_instance is not None:
            AsyncAction._worker_instance.stop()

        AsyncAction._worker_instance = self.worker_cls()
        AsyncAction._worker_instance.start()
        return AsyncOperationResult()

    def stop_operation(self):
        if AsyncAction._worker_instance is None:
            return AsyncOperationResult(is_active=False)
        return AsyncAction._worker_instance.stop()

    def ping_operation(self):
        if AsyncAction._worker_instance is None:
            return AsyncOperationResult(is_active=False)
        return AsyncAction._worker_instance.ping()



  