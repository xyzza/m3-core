#coding: utf-8
import os
from django.conf import settings
from django.shortcuts import render_to_response
from m3.contrib.designer.ide.helpers import JsonResponse, get_files, get_classess, get_methods
from m3.contrib.m3_sandbox import SandboxKeeper

__author__ = 'ZIgi'

from django.http import HttpResponse, Http404


def workspace(request):
    #TODO вставить проверку на метароль разработчика
    base_name = u'Файлы проекта'
    return render_to_response('ide.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save',
        'project_name': base_name,
        'preview_url':'/designer/preview'
    })

def get_project_files(request):
    
    if request.POST.get('class_name') and request.POST.get('path'):
        ui_methods = get_methods(request.POST.get('path'), request.POST.get('class_name'))
        return JsonResponse(ui_methods)
    elif request.POST.get('path'):
        ui_classess = get_classess(request.POST.get('path'))
        return JsonResponse(ui_classess)

    #TODO работает неправильно, нет проверки на то что является разработчиком
    sandbox_account = SandboxKeeper.get_account(request)
    if sandbox_account is None:
        raise Http404

    path_project = os.path.join( settings.SANDBOX_FOLDERS, sandbox_account)
    print path_project
    #path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    files = get_files(os.path.abspath(path_project))
    return JsonResponse(files)
