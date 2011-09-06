#coding: utf-8
import os
from django.shortcuts import render_to_response

__author__ = 'ZIgi'

from django.http import HttpResponse


def workspace(request):
    '''
    Отдается основной шаблон. Точка входа.
    '''

    #path_project = os.getenv('PROJECT_FOR_DESIGNER', None)
    #base_name = os.path.basename(path_project)
    base_name = 'something'
    return render_to_response('ide.html', {
        'data_url' : '/designer/fake',
        'save_url' : '/designer/save',
        'project_name': base_name,
        'preview_url':'/designer/preview'
    })
