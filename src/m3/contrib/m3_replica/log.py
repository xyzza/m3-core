#coding:utf-8
'''
Created on 26.04.2011

@author: akvarats
'''

class ExchangeLog(object):
    '''
    Объект, который собирает лог по процедуре загрузки данных
    '''
    def __init__(self):
        # массивы элементов типа ExchangeLogEntry
        self.errors = []
        self.warnings = []
    
    def append(self, log_entry):
        '''
        Добавляет запись в лог выполнения операции
        '''
        if not log_entry and not isinstance(log_entry, ExchangeLogEntry):
            return
        
        (self.errors if log_entry.type == ExchangeLogEntry.ERROR else self.warnings).append(log_entry)
        
        
    
class ExchangeLogEntry(object):
    '''
    Запись лога выполнения процедуры обмена данными
    '''
    
    ERROR = 0
    WARNING = 1
    
    def __init__(self, message='', source_row=None, objects=None, type=0):
        '''
        @param message: читабельное пользователем сообщение
        @param source_row: пришедшее значение исходной строки данных
        @param objects: объект, либо список объектов, которые были преобразованы в вид, необходимый
            для приемника данных
        @param type: тип сообщения (ошибка, либо предупреждение)
        '''
        self.message = message
        self.source_row = source_row
        self.objects = objects
        self.type = type