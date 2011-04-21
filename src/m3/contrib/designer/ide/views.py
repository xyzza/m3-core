# coding: utf-8

import os
import json
import codecs

from django.http import HttpResponse
from django.shortcuts import render_to_response

from helpers import JsonResponse, get_files, get_classess, restores, create_py_class
from parser import Parser, ParserError

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
    if request.POST.get('path'):
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
            'title':'Ma teh window',
            'layout':'fit',
            'type':'window',
            'id':'self',
            'tbar': {
                'type':'toolbar',
                'id' : 'toolbar',
                'items': [ {
                        'type':'button',
                        'id':'bla',
                        'text':'freaking button'
                    }
                ]
            }

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
        result = Parser(path, class_name).to_designer()
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
    
    return JsonResponse({'success': True, 'data':{'file_content':result}})

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