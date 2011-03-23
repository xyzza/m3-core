#coding:utf-8
__author__ = 'ZIgi'

import json

class DesignerConfigBuilder:

    def create_new(self):
        result = {
            'type':'document',
            'name':'Новый документ',
            'code':'',
            'id':0
        }

        return json.dumps(result)