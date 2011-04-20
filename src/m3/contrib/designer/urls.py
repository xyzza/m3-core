# coding: utf-8

import os

from django.conf.urls.defaults import *
from django.conf import settings


urlpatterns = patterns('',    

    # Точка входа
    (r'^$', 'designer.ide.views.workspace'),
    
    # Файлы проекта
    (r'^project-files$', 'designer.ide.views.get_project_files'), 
                       
    # Создание нового класса в файле    
    (r'^create-new-class$', 'designer.ide.views.create_class'),
                       
    # статичный контент проекта
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
        {'document_root': settings.MEDIA_ROOT}),
    
    # статичный контент для m3 
    (r'^m3static/(?P<path>.*)$', 'django.views.static.serve', 
        {'document_root': os.path.join(settings.M3_ROOT, 'static')}),
    
    (r'^designer$','designer.ide.views.designer'),
    (r'^designer/fake$','designer.ide.views.designer_fake_data'),
    (r'^designer/data$','designer.ide.views.designer_data'),
    (r'designer/save$','designer.ide.views.designer_save'),
    (r'designer/preview$','designer.ide.views.designer_preview'),
    (r'file-content$','designer.ide.views.designer_file_content'),
    (r'file-content/save$','designer.ide.views.designer_file_content_save'),
)
