#coding: utf-8

import os
import json
import codecs
import shutil

from django.shortcuts import render_to_response

from helpers import JsonResponse, get_files, get_classess, restores, create_py_class, \
    create_generation_func, get_methods
from parser import Parser, ParserError, UndefinedGeneratedFunc

def workspace(request):
    '''
    Отдается основной шаблон. Точка входа.
    '''
    path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    base_name = os.path.basename(path_project)
    return render_to_response('master.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save',
        'project_name': base_name,
        'preview_url':'/designer/preview'
    })

def get_project_files(request):
    '''
    Отдает файлы рабочего проекта как узлы дерева
    '''
    
    if request.POST.get('class_name') and request.POST.get('path'):
        ui_methods = get_methods(request.POST.get('path'), request.POST.get('class_name'))
        return JsonResponse(ui_methods)
    elif request.POST.get('path'):
        ui_classess = get_classess(request.POST.get('path')) 
        return JsonResponse(ui_classess)
    
    path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    files = get_files(os.path.abspath(path_project))
    return JsonResponse(files)

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save',
        'code_preview_url' : '/designer/preview'
    })

def designer_preview(request):
    '''
    Вьюшка для preview
    '''
    data = request.POST.get('data')
    js = json.loads(data)
    restores(js['model'])
    
    try:
        py_code = Parser.from_designer_preview(js['model'])
    except ParserError, e:
        return JsonResponse({'success': False, 'json':repr(e)})
    
    return JsonResponse({'success': True, 'json':py_code})

def designer_fake_data(request):
    '''
    Вьюшка для показа формы (fake)
    '''

    data = {
            'title':'Test window',
            'layout':'form',
            'type':'window',
            'id':'self'
        }

    res = {'success':True, 'json':data}
    return JsonResponse(res)

def designer_data(request):
    '''
    Вьюшка для показа формы
    '''

    class_name = request.GET.get('className')
    path = request.GET.get('path')
    
    assert class_name, 'Class name is undefined'
    assert path, 'Path to source file is undefined'
    
    try:
        result = Parser(path, class_name, request.GET.get('funcName')).to_designer()
    except UndefinedGeneratedFunc, e:    
        return JsonResponse({'success': True, 'not_autogenerated': True})
    except ParserError, e:                
        return JsonResponse({'success': False, 'json': repr(e)})
        
    return JsonResponse({'success': True, 'json':result})

def designer_save(request):
    '''
    Вьюшка для сохранения формы
    '''
    class_name = request.POST.get('className')
    path = request.POST.get('path')
    data = request.POST.get('data')    

    assert class_name, 'Class name is undefined'
    assert path, 'Path to source file is undefined'

    js = json.loads(data)    
    restores(js['model'])
    
    # js['model'] -- Конфигурация для отображение в py
    try:
        Parser(path, class_name).from_designer(js['model'])
    except ParserError, e:
        return JsonResponse({'success': False, 'json': repr(e)})
    return JsonResponse({'success': True})


def create_class(request):
    '''
    Создание нового класса
    '''    
    class_name = request.POST.get('className')
    path = request.POST.get('path')    

    assert class_name, 'Class name is undefined'
    assert path, 'Path to source file is undefined'
    
    try:
        create_py_class(path, class_name)
    except ParserError, e:
        return JsonResponse({'success': False, 'json': unicode(e)})
    
    return JsonResponse({'success': True})

def designer_file_content(request):
    '''
    Вьюшка для отдачи содержимого файла
    '''
    path = request.GET.get('path')
    assert path, 'Path to source file is undefined'

    with codecs.open( path, "r", "utf-8" ) as f:
        result = f.read()
    
    return JsonResponse({'success': True, 'data':{'content':result}})

def designer_file_content_save(request):
    '''
    Вьюшка сохраняет изменения
    '''
    path = request.POST.get('path')
    content = request.POST.get('content')

    assert path, 'Path to source file is undefined'

    success = False
    error =''

    try:
        with codecs.open( path, "w", "utf-8" ) as f:
            f.write(content)
            success = True
    except IOError as (errno, strerror):
        error =  "I/O error({0}): {1}".format(errno, strerror)

    return JsonResponse({'success': success, 'error': error})

def create_initialize(request):
    '''
    Генерирует функции для работы дизайнера
    '''
    class_name = request.POST.get('className')
    path = request.POST.get('path')

    try:
        create_generation_func(path, class_name)
    except ParserError, e:
        return JsonResponse({'success': False, 'json': unicode(e)})
    else:
        return JsonResponse({'success': True})

def designer_structure_manipulation(request):
    '''
    Производит манипуляции над структурой проекта
    path ( путь к объекту )
    action: delete, rename, new ( Действия )
    error ( Ошибка, произошедшая во время выполения )
    success ( Результат )
    Действия производятся как над файлами так и над директориями.
    '''
    #Типы
    type_file = 'file'
    type_dir = 'dir'
    #Действия
    action_delete = 'delete'
    action_rename = 'rename'
    action_new = 'new'
    #Виды ошибок
    error_type_exist = 'exist'
    error_type_internal = 'internal'
    
    success = False
    error = {}
    data = {}

    path = request.POST.get('path')
    assert path, 'Path to source file is undefined'

    action = request.POST.get('action')
    assert action, 'Аction to target is undefined'

    type = request.POST.get('type')
    assert type, 'Type is undefined'

    #Доступ на перезапись, удаление директорий с фалами или подпапками
    access = request.POST.get('access', 0)
    name = request.POST.get('name','')

    dirpath = os.path.split(path)[0] # path head & tail
    current_path = os.path.join(path if os.path.isdir(path) else dirpath, name)

    if os.path.exists(current_path) and not access:
        error = {'msg':name+u' уже существует', 'type': error_type_exist}
        return JsonResponse({'success': success, 'error': error})
    try:
        # Создание новых файлов, директорий
        if action == action_new:
            # Если файл создается в директории то проверяем именно в ней
            if os.path.isdir(path) and type == type_file:
                current_path = os.path.join(path, name)

            #Создаем новую директорию
            if type == type_dir:
                if os.path.isdir(path):
                    current_path = os.path.join(path, name)
                    os.mkdir(current_path)
                else:
                    os.mkdir(current_path)
                success = True
                data = {'path':current_path}

            #Создаем новый файл
            elif type == type_file:
                with codecs.open( current_path, "w", "utf-8" ) as f:
                    f.write("#coding: utf-8")
                success = True
                data = {'path':current_path}

        # Удаление файлов, директорий
        elif action == action_delete:
            if os.path.isdir(path):
                #Удалается включая подпапки и файлы
                shutil.rmtree(path)
                success = True
            else:
                os.remove(path)
                success = True

        # Переименование файлов, директорий
        elif action == action_rename:
            #Хак т.к в виндах падает ошибка при попытке переименовать в сущ. файл
            if access and os.sys.platform =='win32':
                if os.path.isdir(current_path):
                    shutil.rmtree(current_path)
                else:
                    os.remove(current_path)
            #Файлы и Директории
            os.rename(path, current_path)
            success = True

    except OSError as (errno, strerror):
        if os.sys.platform =='win32':
            strerror = strerror.decode('cp1251')
        error =  {'msg':u"OSError error({0}): {1}".format(errno, strerror),
                'type':error_type_internal}

    return JsonResponse({'success': success, 'data': data, 'error': error})


def upload_code(request):
    '''
    Конвертация python кода в js представление
    '''    
    source = request.POST.get('data')
    
    # Пока непонятно каким образом приходит текст, приходится писать нечто ниже
    try:
        data = Parser('','').to_designer_preview(source.replace('\u000a','\n')[1:-1])
    except ParserError, e:
        return JsonResponse({'success': False, 'json': repr(e)})
    else:        
        return JsonResponse({'success': True, 'data': data})