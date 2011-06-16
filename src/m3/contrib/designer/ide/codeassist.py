# -*- coding: utf-8 -*-
from rope.base.project import Project
from rope.contrib import codeassist
from django.conf import settings

__author__ = 'ZIgi'

def get_code_proposals(code, offset):

    proj = Project(settings.PROJECT_ROOT)
    props = codeassist.code_assist(proj, code, offset)
    sorted = codeassist.sorted_proposals(props)
    result = []

    for p in sorted:
        s = p.name + ' (' + p.kind + ',' + p.scope +  ')'
        result.append(s)

    #TODO
    #когда взываеццо код ассист надо отлавливать исключение, которое робе кидает в случае если в коде есть
    #синтаксические ошибки

    return result

