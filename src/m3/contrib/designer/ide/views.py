# coding: utf-8

from django.shortcuts import render_to_response


def workspace(request):
    return render_to_response('master.html')