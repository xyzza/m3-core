# -*- coding: utf-8 -*-

import subprocess as sub
import json
import sys
import os

JAR_FULL_PATH = os.path.join(os.path.dirname(__file__), 'report.jar')

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
            f.write(result)
    
    make_report_from_json_string(result)
    


def make_report_from_json_string(json_str):
    '''
    Вызавает генератор отчета и передает ему в качестве исходных данных JSON строку.
    @param json_str: Строка JSON
    '''
    # При передаче данных через стандартные потоки ввода/вывода
    # важно кодировать/декодировать в кодировку консоли
    encoding_name = sys.stdout.encoding
    process = sub.Popen(['java', '-jar', JAR_FULL_PATH, encoding_name], 
                        stdin = sub.PIPE, stdout = sub.PIPE, stderr = sub.PIPE)
    result_out, result_err = process.communicate(input = json_str.encode(encoding_name))
    __check_process(encoding_name, process, result_err)
 

