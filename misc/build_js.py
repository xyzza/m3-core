# coding:utf-8

import os
import codecs
import subprocess
import conf

def add_file(src_file, dst_files, folder):
    '''
    Добавляет к файлу файлы из папки 
    @attr src_file Исходный файл
    @attr dst_files Файлы, которые необходимо добавить
    @attr folder Папка откуда добавляются файлы
    '''
    for ffile in dst_files:
        file_names = ffile.split('.')
        if len(file_names) > 0 and file_names[-1] in conf.FILE_EXTENSIONS:
                        
            file_path = os.path.join(folder, ffile)
            with codecs.open(file_path, 'r', encoding='utf-8') as f:
                src_file.write(f.read())
                src_file.write('\n')

def compile_production(src_file):
    '''
    Компиляция google closure
    '''
    new_file_name = os.path.join(conf.INNER_JS_FOLDER, conf.FILE_NAME_OPT) 
    command = 'java -jar compiler.jar --js %s --js_output_file %s' % \
        (src_file, new_file_name)
    popen = subprocess.Popen(
        command,
        shell = True,
    )
    popen.wait()

def main():
    '''
    Основная функция
    '''
    new_file_name = os.path.join(conf.INNER_JS_FOLDER, conf.FILE_NAME)
    with codecs.open(new_file_name, 'w+', encoding='utf-8', buffering=0) as new_file:
        # Загрузка внешних файлов
        add_file(new_file, os.listdir(conf.OUTER_JS_FOLDER), conf.OUTER_JS_FOLDER)
        
        # Загрузка внутренних файлов с высоким приоритетом
        file_list_hight_priority = conf.HIGH_PRIORITY
        add_file(new_file, file_list_hight_priority, conf.INNER_JS_FOLDER)
    
        # Загрузка внутренних файлов с средним приоритетом
        file_list_middle_priority = [f for f in os.listdir(conf.INNER_JS_FOLDER) 
                                     if f not in conf.HIGH_PRIORITY and 
                                     f not in conf.LOW_PRIORITY and 
                                     f not in conf.EXCLUDE]
    
        add_file(new_file, file_list_middle_priority, conf.INNER_JS_FOLDER)
    
        # Загрузка внутренних файлов с низким приоритетом
        file_list_low_priority = conf.LOW_PRIORITY
        add_file(new_file, file_list_low_priority, conf.INNER_JS_FOLDER)
        

    compile_production(new_file_name)

if __name__ == '__main__':
    main()
    print "It's a Good job"