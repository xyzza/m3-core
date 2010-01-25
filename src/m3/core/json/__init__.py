#coding:utf-8

import copy
import datetime
import json

class M3JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        cleaned_dict = {}
        dict = obj.__dict__
        for attribute in dict.keys():
            if len(attribute) > 6 and attribute[len(attribute)-6:len(attribute)] == '_cache':
                try:
                    cleaned_dict[attribute[1:len(attribute)-6] + '_ref_name'] = dict['name']
                except:
                    pass
            elif isinstance(dict[attribute], datetime.datetime):
                cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y %H:%M:%S')
            elif isinstance(dict[attribute], datetime.date):
                cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y')
            else:
                cleaned_dict[attribute] = dict[attribute]
        return cleaned_dict