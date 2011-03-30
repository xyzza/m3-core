# coding: utf-8

import os
import json
import sys

from django.http import HttpResponse
from django.shortcuts import render_to_response

from helpers import get_files

def workspace(request):
    '''
    Отдается основной шаблон. Точка входа.
    '''
    return render_to_response('master.html')

def get_project_files(request):
    path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    print os.path.abspath(path_project)
    
    files = get_files(os.path.abspath(path_project))

    return HttpResponse(content_type='application/json', 
                        content = json.dumps(files))

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : '/designer/fake'
    })

def designer_fake_data(request):
    result = {
            'type':'window',
            'name':'Ext window',
            'title':'Trololo',
            'layout':'fit',
            'id':0
        }
    return HttpResponse(content_type='application/json', 
                        content = json.dumps(result))
