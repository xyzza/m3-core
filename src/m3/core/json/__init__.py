#coding:utf-8

import copy
import datetime
import json
import decimal
import string

class M3JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        cleaned_dict = {}
        # Прошерстим методы и свойства, найдем те, которые могут передаваться на клиента
        # Клонирование словаря происходит потому, что сериализуемые методы переопределяются результатами своей работы
        dict = copy.copy(obj.__dict__)
        for attr in dir(obj):
            # Во всех экземплярах моделей Django есть атрибут "objects", т.к. он является статик-атрибутом модели.
            # Но заботливые разработчики джанги позаботились о нас и выкидывают спицифичную ошибку 
            # "Manager isn't accessible via %s instances" при обращении из экземпляра. Поэтому "objects" нужно игнорировать.
            if not attr.startswith('_') and attr!='objects' and attr!='tree':
                try:
                    if hasattr(getattr(obj, attr), 'json_encode'):
                        if getattr(obj, attr).json_encode:
                            dict[attr] = getattr(obj, attr)()
                except Exception, exc:
                    # Вторая проблема с моделями в том, что dir кроме фактических полей возвращает ассессоры.
                    # При попытке обратиться к ним происходит запрос(!) и может возникнуть ошибка DoesNotExist
                    # Заботливые разработчики Django сделали её разной для всех моделей ;)
                    if exc.__class__.__name__.find('DoesNotExist') == -1:
                        raise
                    
        for attribute in dict.keys():
            # Для полей типа myfield_id автоматически создается атрибут ссылающияся на наименование,
            # например для myfield_id будет myfield_ref_name, конечно если у модели myfield есть name.
            # Зачем это нужно - х.з.
            if len(attribute) > 3 and attribute.endswith('_id'):
                try:
                    field_name = attribute[0:len(attribute)-3]
                    cleaned_dict[field_name + '_ref_name'] = getattr(getattr(obj, field_name), 'name')
                except:
                    pass
            if len(attribute) > 6 and attribute.endswith('_cache'):
                try:
                    cleaned_dict[attribute[1:len(attribute)-6] + '_ref_name'] = dict['name']
                except:
                    pass
            elif isinstance(dict[attribute], datetime.datetime):
                #cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y %H:%M:%S')
                # для дат, до 1900 года метод выше не работает
                time = dict[attribute]
                cleaned_dict[attribute] = '%02d.%02d.%04d %02d:%02d:%02d' % (time.day,time.month,time.year,time.hour,time.minute,time.second)
            elif isinstance(dict[attribute], datetime.date):
                #cleaned_dict[attribute] = dict[attribute].strftime('%d.%m.%Y')
                # для дат, до 1900 года метод выше не работает
                day = dict[attribute]
                cleaned_dict[attribute] = '%02d.%02d.%04d' % (day.day,day.month,day.year)
            elif isinstance(dict[attribute], datetime.time):
                cleaned_dict[attribute] = dict[attribute].strftime('%H:%M')
            elif isinstance(dict[attribute], decimal.Decimal):
                cleaned_dict[attribute] = str(dict[attribute])
            else:
                cleaned_dict[attribute] = dict[attribute]
        return cleaned_dict