# coding: utf-8

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.urlresolvers import reverse
import json

def workspace(request):
    return render_to_response('master.html')

def designer(request):
    return render_to_response('designer.html', {
        'data_url' : '/designer/fake'
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
    return HttpResponse(mimetype='application/json', content = json.dumps(result))
