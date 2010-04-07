#coding: utf-8
'''
Хелперы для валидации значений
Created on 20.01.2010

@author: akvarats
'''

class Validator:
    '''
    Класс, обеспечивающий выполнение валидации объектов
    на корректность их состояния.
    '''
    def __init__(self):
        self.rules = []
    
#------------------------------------------------------------------------------ 
# методы добавления правил валидации
#------------------------------------------------------------------------------ 
    def addrule_notempty(self, value, fail_msg, on_success=None, on_fail=None):
        '''
        Добавляет правило валидации значения на непустоту
        ''' 
        rule = NotEmptyValidationRule()
        rule.value = value
        rule.fail_msg = fail_msg
        rule.callback_on_success = on_success
        rule.callback_on_fail = on_fail
        self.rules.append(rule)
        
    def addrule_failed(self, fail_msg, on_success=None, on_fail=None):
        rule = FailedValidationRule()
        rule.fail_msg = fail_msg
        rule.callback_on_success = on_success
        rule.callback_on_fail = on_fail
        self.rules.append(rule)
        
    def addrule_equal(self, value, fail_msg, on_success=None, on_fail=None):
        rule = NotEqualValidationRule()
        rule.value = value
        rule.fail_msg = fail_msg
        rule.callback_on_success = on_success
        rule.callback_on_fail = on_fail
        self.rules.append(rule)
        
#------------------------------------------------------------------------------
# методы добавления правил валидации 
#------------------------------------------------------------------------------ 
    def check(self, raise_exception=True):
        result = []
        for rule in self.rules:
            if not rule.check():
                result.append(rule.fail_msg)
                if rule.callback_on_fail:
                    rule.callback_on_fail()
            else:
                if rule.callback_on_success:
                    rule.callback_on_success()
        if result and raise_exception:
            e = ValidationFailed()
            for message in result:
                e.add_error_message(message)
            raise e
            
        return result
        
class BaseValidationRule(object):
    '''
    Базовое правило валидации значений.
    
    Ничего по сути не делает
    '''
    def __init__(self):
        self.value = ''
        self.fail_msg = ''
        self.callback_on_success = None
        self.callback_on_fail = None
    def check(self):
        return True
        
class NotEmptyValidationRule(BaseValidationRule):
    '''
    Правило валидации значения на непустоту
    '''
    def check(self):
        return True if self.value else False
    
class NotEqualValidationRule(BaseValidationRule):
    '''
    Правило проверяет равны ли значения из списка между собой
    Проще говоря 
    '''
    def check(self):
        assert isinstance(self.value, (list, tuple))
        assert len(self.value) >= 2
        last_value = self.value[0]
        for value in self.value[1:]:
            if last_value != value:
                return False
            last_value = value
        return True
    
class FailedValidationRule(BaseValidationRule):
    '''
    Правило валидации, которое заведомо является неправильным
    '''
    def check(self):
        return False # надо тупо записать текущее сообщение в список ошибок

#===============================================================================
# Исключительная ситуация 
#===============================================================================
class ValidationFailed(Exception):
    '''
    Исключение для ситуаций валидации пользовательских данных
    '''
    def __init__(self):
        self.error_messages = [] # список ошибок валидации
        
    def add_error_message(self, message):
        self.error_messages.append(message)
        
    def has_errors(self):
        return self.error_messages
    
    def messages_as_string(self, line_preffix = '  - ', line_delimiter='\n'):
        '''
        Преобразует self.error_messages в одну строку для отдачи в html
        представление
        '''
        result = ''
        for message in self.error_messages:
            result += line_preffix + message + line_delimiter
        if result:
            result = result[0:len(result)-len(line_delimiter)]
        return result
    
    def messages_to_html(self):
        return self.messages_as_string(line_preffix = '&nbsp;&nbsp;-&nbsp;', line_delimiter='<br>')