# coding: utf-8

import os

from django.conf.urls.defaults import *
from django.conf import settings


urlpatterns = patterns('',    

    # Точка входа
    (r'^$', 'designer.ide.views.workspace'),
                       
    # статичный контент проекта
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
        {'document_root': settings.MEDIA_ROOT}),
    
    # статичный контент для m3 
    (r'^m3static/(?P<path>.*)$', 'django.views.static.serve', 
        {'document_root': os.path.join(settings.M3_ROOT, 'static')}),
    

)
