#coding:utf-8

import copy
import datetime
import json
import decimal
import string

class M3JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        cleaned_dict = {}
        dict = copy.copy(obj.__dict__)
        # прошерстим методы и свойства, найдем те, которые могут передаваться на клиента
        for attr in dir(obj):
            if not attr.startswith('_'):
                try:
                    if hasattr(getattr(obj, attr), 'json_encode'):
                        if getattr(obj, attr).json_encode:
                            dict[attr] = getattr(obj, attr)()
                except:
                    pass
        for attribute in dict.keys():
            if len(attribute) > 3 and attribute[len(attribute)-3:len(attribute)] == '_id':
                try:
                    field_name = attribute[0:len(attribute)-3]
                    cleaned_dict[field_name + '_ref_name'] = getattr(getattr(obj, field_name), 'name')
                except:
                    pass
            if len(attribute) > 6 and attribute[len(attribute)-6:len(attribute)] == '_cache':
                try:
                    cleaned_dict[attribute[1:len(attribute)-6] + '_ref_name'] = dict['name']
                except:
                    pass
            elif isinstance(dict[attribute], datetime.datetime):
                cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y %H:%M:%S')
            elif isinstance(dict[attribute], datetime.date):
                cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y')
            elif isinstance(dict[attribute], datetime.time):
                cleaned_dict[attribute] = dict[attribute].strftime('%H:%M')
            elif isinstance(dict[attribute], decimal.Decimal):
                cleaned_dict[attribute] = str(dict[attribute])
            else:
                cleaned_dict[attribute] = dict[attribute]
        return cleaned_dict