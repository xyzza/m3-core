# -*- coding: utf-8 -*-

import subprocess as sub
from django.conf import settings
from django.utils import importlib
import json
import sys
import os

#============================== ПАРАМЕТРЫ ================================

def __get_template_path():
    ''' Ищем корневую папку проекта '''
    mod = importlib.import_module(settings.SETTINGS_MODULE)
    settings_abs_path = os.path.dirname(mod.__file__)
    return settings_abs_path
    
JAR_FULL_PATH = os.path.join(os.path.dirname(__file__), 'report.jar')
DEFAULT_REPORT_TEMPLATE_PATH = __get_template_path()

#============================= ИСКЛЮЧЕНИЯ ================================

class ReportGeneratorNotResponse(Exception):
    pass

class ReportGeneratorError(Exception):
    pass

#============================== ЛОГИКА ===================================


def __check_process(encoding_name, process, result_err):
    # Если не завершился сам, то поможем
    if process.poll() is None:
        process.terminate()
        raise ReportGeneratorNotResponse(JAR_FULL_PATH + ' ' + encoding_name)
    # Если процесс навернулся, надо вежливо вернуть ошибку
    if process.returncode != 0:
        raise ReportGeneratorError(result_err)
    

def make_report_from_object(obj, dump_to_file = None):
    '''
    Вызывает генератор отчета и передает ему объект с исходными данными
    @param obj: Объект с данными
    @param dump_to_file: Файл в который записывается результат сериализации (для отладки)
    '''
    assert isinstance(obj, dict)
    indent = 0
    if dump_to_file is not None:
        indent = 4;
    result = json.dumps(obj, skipkeys = True, indent = indent, ensure_ascii = False)
    
    # Для отладки пишем результат в файл
    if dump_to_file is not None:
        assert isinstance(dump_to_file, str)
        with open(dump_to_file, "w") as f:
            f.write(result.encode("utf-8"))
    
    make_report_from_json_string(result)
    


def make_report_from_json_string(json_str):
    '''
    Вызавает генератор отчета и передает ему в качестве исходных данных JSON строку.
    @param json_str: Строка JSON
    '''
    # При передаче данных через стандартные потоки ввода/вывода
    # важно кодировать/декодировать в кодировку консоли
    if hasattr(sys.stdout, 'encoding'):
        encoding_name = sys.stdout.encoding
    else:
        # Под нормальным сервером перекодировка не нужна
        encoding_name = 'utf-8'
    process = sub.Popen(['java', '-jar', JAR_FULL_PATH, encoding_name], 
                        stdin = sub.PIPE, stdout = sub.PIPE, stderr = sub.PIPE)
    result_out, result_err = process.communicate(input = json_str.encode(encoding_name))
    __check_process(encoding_name, process, result_err)
 
class BaseReport:
    ''' Базовый класс для создания отчетов '''
    
    # Определяет путь к файлу шаблона относительно папки шаблонов
    template_name = ''
    
    # Определяет путь к файлу результата относительно папки результатов
    result_name = ''
    
    def make_report(self):
        ''' Запускает формирование отчета '''
        obj = self.collect()
        if not isinstance(obj, dict):
            raise ReportGeneratorError(u"Собранные данные должны быть упакованы в словарь")
        if len(self.template_name) == 0:
            raise ReportGeneratorError(u"template_name должен быть переопределен")
        if len(self.result_name) == 0:
            raise ReportGeneratorError(u"result_name должен быть переопределен")
        
        # Создаем абсолютные пути
        tfp = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, self.template_name)
        ofp = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, self.result_name)
        if sys.platform.find('linux') > -1:
            # os.path.normpath - нормализует неправильно
            tfp = tfp.replace('\\', '/')
            ofp = ofp.replace('\\', '/')
        obj["TEMPLATE_FILE_PATH"] = tfp
        obj["OUTPUT_FILE_PATH"]   = ofp
        
        make_report_from_object(obj)
    
    def collect(self):
        ''' Функция отвечающая за формирование данных '''
        raise NotImplemented(u"Функция сбора данных должна быть переопределена в классах потомках")
    
    
    

