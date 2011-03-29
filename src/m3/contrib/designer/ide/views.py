# coding: utf-8

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.urlresolvers import reverse
import json

def workspace(request):
    return render_to_response('master.html')

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : 'designer/fake'
    })

def designer_fake_data(request):
    result = {
            'type':'window',
            'name':'Ext window',
            'title':'Trololo',
            'layout':'fit',
            'id':0
        }
    return HttpResponse(content_type='application/json', content = json.dumps(result))
