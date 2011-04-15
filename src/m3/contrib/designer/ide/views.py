# coding: utf-8

import os
import json

from django.http import HttpResponse
from django.shortcuts import render_to_response

from helpers import get_files, get_classess, restores, create_py_class
from parser import Parser


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
        
        return HttpResponse(content_type='application/json', 
                        content = json.dumps(ui_classess))
    
    path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    files = get_files(os.path.abspath(path_project))
    
    #print files
    
    return HttpResponse(content_type='application/json', 
                        content = json.dumps(files))

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save',
        'code_preview_url' : '/designer/preview'
    })

def designer_preview(request):
    data = request.POST.get('data')
    js = json.loads(data)
    restores(js['model'])
    py_code = Parser('','').from_designer_preview(js['model'])
    return HttpResponse(content=py_code)

def designer_fake_data(request):
    '''
    Вьюшка для показа формы (fake)
    '''

    result = {
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

    return HttpResponse(content_type='application/json', 
                        content = json.dumps(result))

def designer_data(request):
    '''
    Вьюшка для показа формы
    '''

    class_name = request.GET.get('className')
    path = request.GET.get('path')
    
    assert class_name, 'Class name is undefined'
    assert path, 'Path to source file is undefined'
    
    result = Parser(path, class_name).to_designer() 
    
    return HttpResponse(content_type='application/json', 
                        content = json.dumps(result))

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
    Parser(path, class_name).from_designer(js['model']) 

    return HttpResponse(content = 'OK')


def create_class(request):
    '''
    Создание нового класса
    '''    
    class_name = request.POST.get('className')
    path = request.POST.get('path')    

    assert class_name, 'Class name is undefined'
    assert path, 'Path to source file is undefined'
    
    create_py_class(path, class_name)
    
    res_dict = {'success': True}
    return HttpResponse(json.dumps(res_dict), content_type='application/json')