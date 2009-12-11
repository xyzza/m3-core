# -*- coding: utf-8 -*-
'''
Created on 09.12.2009
@author: Vadim
'''

from django.conf.urls.defaults import *
from ORM_test.benchmark.views import *

urlpatterns = patterns('',
    # Example:
    (r'^$', index),
    (r'^stats/$', stats),
    (r'^start/$', benchmark),
    (r'^delete/$', remove),
    (r'^test1/$', benchmark_singleSelect),
    
)
