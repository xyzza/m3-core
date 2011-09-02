#coding: utf-8
__author__ = 'ZIgi'

from django.http import HttpResponse

def test(request):

    return HttpResponse(content = 'sucsesfull response is sucsesfull')
