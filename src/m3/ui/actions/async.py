#coding:utf-8
__author__ = 'ZIgi'

from threading import Thread
from m3.ui.actions import Action, ACD
from m3.ui.actions.results import ActionResult
import json
from django import http

class IBackgroundWorker(Thread):

    def start(self):
        #это стандартный метод объект Thread
        super(IBackgroundWorker, self).start()

    def run(self):
        raise NotImplementedError('Attribute run must be overrided in  child class')

    def stop(self):
        raise NotImplementedError('Attribute stop must be overrided in  child class')

    def ping(self):
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

    COMMAND_START = 0
    COMMAND_STOP = 1
    COMMAND_PING = 2

    worker_cls = None
    _worker_instance = None

    def __init__(self):
        super(AsyncAction, self).__init__()

    def context_declaration(self):
        return [
            ACD(name='command', type=int, required=True)
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



  