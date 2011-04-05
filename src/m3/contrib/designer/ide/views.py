# coding: utf-8

import os
import json

from django.http import HttpResponse
from django.shortcuts import render_to_response

from helpers import Parser, get_files
from m3.contrib.designer.ide.helpers import get_classess


def workspace(request):
    '''
    Отдается основной шаблон. Точка входа.
    '''
    return render_to_response('master.html')

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
    return HttpResponse(content_type='application/json', 
                        content = json.dumps(files))

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save'
    })

def designer_fake_data(request):
    result = {
            'properties': {
                'name':'Ext window',
                'title':'Trololo',
                'layout':'fit',
            },
            'type':'window',
            'id':0
        }

    return HttpResponse(content_type='application/json', 
                        content = json.dumps(result))

def designer_save(request):
    
    fake_data = {
        'properties': {
            'name':'Ext window',
            'title':'Trololo',
            'layout':'fit',
        },
        'type':'window',
        'items': [{
            'properties': {
                'name':'Ext window',
                'title':'Trololo',
                'layout':'fit'
            },
            'type': 'panel'  
        }]        
    }
    
    parser = Parser('tests.py', 'TestOne')
    parser.from_designer(fake_data)
    
    return HttpResponse(content = 'OK')
