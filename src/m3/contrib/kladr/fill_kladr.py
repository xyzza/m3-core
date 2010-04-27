#coding:utf-8

import os

from django.db import transaction
from dbfpy import dbf

from m3.contrib.kladr import models


@transaction.commit_on_success
def fill_kladr():
    '''
    Заполнение справочника КЛАДР 
    ''' 
    def fill_record(result_list, rec, type):
        temp_dict = {}
        temp_dict['name'] = rec[0].decode('866')
        temp_dict['socr'] = rec[1].decode('866')
        temp_dict['code'] = rec[2].decode('866')
        temp_dict['zipcode'] = rec[3].decode('866')
        temp_dict['gni'] = rec[4].decode('866')
        temp_dict['uno'] = rec[5].decode('866')
        temp_dict['okato'] = rec[6].decode('866')
        temp_dict['status'] = rec[7].decode('866')
        # признак добавления в БД
        temp_dict['flag'] = False
        temp_dict['id'] = 0
        if type == 'subject':
            code = temp_dict['code'][:2]
        if type == 'region':
            code = temp_dict['code'][:5]
        if type == 'city':
            code = temp_dict['code'][:8]
        if type == 'place':
            code = temp_dict['code'][:11]       
            
        result_list[code] = temp_dict   
    
    MOD_PATH = os.path.dirname(__file__)
    db_file_geo = os.path.normpath(os.path.join(MOD_PATH, "../../externals/KLADR.dbf"))
    db_file_street = os.path.normpath(os.path.join(MOD_PATH, "../../externals/STREET.dbf"))
    
    # открываем .dbf для чтения
    db_geo = dbf.Dbf(db_file_geo, readOnly=True, new=False)
    db_street = dbf.Dbf(db_file_street, readOnly=True, new=False)

    # список субъектов
    sub_list = {}
    # список районов
    region_list = {}     
    # список городов
    city_list = {}
    # список нас.пунктов
    geo_places_list = {}
    
    error_code_list = []
    error_code_streets_list = []
    not_actual_places_list = []
    
    for rec in db_geo: 
        if str(rec[2])[2:] == '00000000000':
            fill_record(sub_list,rec, 'subject')
        if (str(rec[2])[5:] == '00000000') and (str(rec[2])[2:5] != '000'):
            fill_record(region_list,rec, 'region')
        if (str(rec[2])[8:] == '00000') and (str(rec[2])[5:8] != '000'):
            fill_record(city_list,rec, 'city')
        if (str(rec[2])[11:] == '00') and (str(rec[2])[8:11] != '000'):
            fill_record(geo_places_list,rec, 'place')
        else:
            not_actual_places_list.append(rec[2])                 
    
    # Список улиц
    street_list = []
    for rec in db_street:
        street_list.append(rec)
    
    for sub_value in sub_list.itervalues():
        new_kladr_geo_sub = models.KladrGeo()
        new_kladr_geo_sub.parent = None
        new_kladr_geo_sub.name = sub_value['name']
        new_kladr_geo_sub.socr = sub_value['socr']
        new_kladr_geo_sub.code = sub_value['code']
        new_kladr_geo_sub.zipcode = sub_value['zipcode']
        new_kladr_geo_sub.gni = sub_value['gni']
        new_kladr_geo_sub.uno = sub_value['uno']
        new_kladr_geo_sub.okato = sub_value['okato']
        new_kladr_geo_sub.status = sub_value['status']
        new_kladr_geo_sub.save()
        
        sub_value['id'] = new_kladr_geo_sub.id
        sub_value['flag'] = True
        print (new_kladr_geo_sub.name)
    
    for region_key in region_list.itervalues():
        code = region_key['code'][:2]
        if not(region_key['flag']):
            sub = sub_list[code]
            new_kladr_geo_region = models.KladrGeo()
            new_kladr_geo_region.parent_id = int(sub['id'])
            new_kladr_geo_region.name = region_key['name']
            new_kladr_geo_region.socr = region_key['socr']
            new_kladr_geo_region.code = region_key['code']
            new_kladr_geo_region.zipcode = region_key['zipcode']
            new_kladr_geo_region.gni = region_key['gni']
            new_kladr_geo_region.uno = region_key['uno']
            new_kladr_geo_region.okato = region_key['okato']
            new_kladr_geo_region.status = region_key['status']
            new_kladr_geo_region.save()
            
            region_key['id'] = new_kladr_geo_region.id
            region_key['flag'] = True
            print (' '*5+new_kladr_geo_region.name)
    
    for city_key in city_list.itervalues():
        code = city_key['code'][:5]
        if code[2:] == '000':
            # ищем родителя в субъектах
            if not city_key['flag']:
                code = code[:2]
                sub = sub_list[code]
                new_kladr_geo_city = models.KladrGeo()
                new_kladr_geo_city.parent_id = int(sub['id'])
                new_kladr_geo_city.name = city_key['name']
                new_kladr_geo_city.socr = city_key['socr']
                new_kladr_geo_city.code = city_key['code']
                new_kladr_geo_city.zipcode = city_key['zipcode']
                new_kladr_geo_city.gni = city_key['gni']
                new_kladr_geo_city.uno = city_key['uno']
                new_kladr_geo_city.okato = city_key['okato']
                new_kladr_geo_city.status = city_key['status']
                new_kladr_geo_city.save()
            
                city_key['id'] = new_kladr_geo_city.id
                city_key['flag'] = True
                print (' '*8+new_kladr_geo_city.name)
                
        elif code[2:] != '000':
            # ищем родителя в регионах
            if not city_key['flag']:
                region = region_list[code]
                new_kladr_geo_city = models.KladrGeo()
                new_kladr_geo_city.parent_id = int(region['id'])
                new_kladr_geo_city.name = city_key['name']
                new_kladr_geo_city.socr = city_key['socr']
                new_kladr_geo_city.code = city_key['code']
                new_kladr_geo_city.zipcode = city_key['zipcode']
                new_kladr_geo_city.gni = city_key['gni']
                new_kladr_geo_city.uno = city_key['uno']
                new_kladr_geo_city.okato = city_key['okato']
                new_kladr_geo_city.status = city_key['status']
                new_kladr_geo_city.save()
            
                city_key['id'] = new_kladr_geo_city.id
                city_key['flag'] = True
                print (' '*8+new_kladr_geo_city.name)
    
    for place_value in geo_places_list.itervalues():
        code = place_value['code'][:8]
        if (code[2:5] == '000') and (code[5:8] != '000') or ((code[2:5] != '000') and (code[5:8] != '000')):
            #поиск родителя в городах
            if not place_value['flag']:
                code = code[:8]
                try:
                    place = city_list[code]
                except KeyError:
                    error_code_list.append(code)
                else:    
                    new_kladr_geo_place = models.KladrGeo()
                    new_kladr_geo_place.parent_id = int(place['id'])
                    new_kladr_geo_place.name = place_value['name']
                    new_kladr_geo_place.socr = place_value['socr']
                    new_kladr_geo_place.code = place_value['code']
                    new_kladr_geo_place.zipcode = place_value['zipcode']
                    new_kladr_geo_place.gni = place_value['gni']
                    new_kladr_geo_place.uno = place_value['uno']
                    new_kladr_geo_place.okato = place_value['okato']
                    new_kladr_geo_place.status = place_value['status']
                    new_kladr_geo_place.save()
                
                    place_value['id'] = new_kladr_geo_place.id
                    city_key['flag'] = True
                    print (' '*13+new_kladr_geo_place.name)
                
        elif (code[5:8] == '000') and not (code[2:5] == '000'):
            #поиск родителя в районах   
            if not place_value['flag']:
                code = code[:5]
                try:
                    place = region_list[code]
                except KeyError:
                    error_code_list.append(code)
                else:                
                    new_kladr_geo_place = models.KladrGeo()
                    new_kladr_geo_place.parent_id = int(place['id'])
                    new_kladr_geo_place.name = place_value['name']
                    new_kladr_geo_place.socr = place_value['socr']
                    new_kladr_geo_place.code = place_value['code']
                    new_kladr_geo_place.zipcode = place_value['zipcode']
                    new_kladr_geo_place.gni = place_value['gni']
                    new_kladr_geo_place.uno = place_value['uno']
                    new_kladr_geo_place.okato = place_value['okato']
                    new_kladr_geo_place.status = place_value['status']
                    new_kladr_geo_place.save()
                
                    place_value['id'] = new_kladr_geo_place.id
                    city_key['flag'] = True
                    print (' '*13+new_kladr_geo_place.name)
                
        elif (code[5:8] == '000') and (code[2:5] == '000'):
            #поиск родителя в субъектах   
            if not place_value['flag']:
                code = code[:2]
                try:
                    place = sub_list[code]
                except KeyError:
                    error_code_list.append(code)
                else:                
                    new_kladr_geo_place = models.KladrGeo()
                    new_kladr_geo_place.parent_id = int(place['id'])
                    new_kladr_geo_place.name = place_value['name']
                    new_kladr_geo_place.socr = place_value['socr']
                    new_kladr_geo_place.code = place_value['code']
                    new_kladr_geo_place.zipcode = place_value['zipcode']
                    new_kladr_geo_place.gni = place_value['gni']
                    new_kladr_geo_place.uno = place_value['uno']
                    new_kladr_geo_place.okato = place_value['okato']
                    new_kladr_geo_place.status = place_value['status']
                    new_kladr_geo_place.save()
                
                    place_value['id'] = new_kladr_geo_place.id
                    city_key['flag'] = True
                    print (' '*13+new_kladr_geo_place.name)
    
    # Загрузка улиц. (порядка 3х часов)
    for street in iter(street_list):
        code = street[2].decode('866')
        if code[15:] == '00':
            if code[2:11] == '000000000':
                # поиск родителя в субъектах
                code = code[:2]
                try:
                    parent_id = sub_list[code]
                except KeyError:
                    error_code_streets_list.append(code)
                else:
                    street_sub = models.KladrStreet()
                    street_sub.parent_id = int(parent_id['id'])
                    street_sub.name = street[0].decode('866')
                    street_sub.socr = street[1].decode('866')
                    street_sub.code = street[2].decode('866')
                    street_sub.zipcode = street[3].decode('866')
                    street_sub.gni = street[4].decode('866')
                    street_sub.okato = street[5].decode('866')
                    street_sub.save()
                    
                    print (' '*20 + street_sub.name)
                    
            elif (code[8:11] == '000') and (code[5:8] != '000'):
                # поиск родителя в городах
                code = code[:8]
                try:
                    parent_id = city_list[code]
                except:
                    error_code_streets_list.append(code)
                else:
                    street_city = models.KladrStreet()
                    street_city.parent_id = int(parent_id['id'])
                    street_city.name = street[0].decode('866')
                    street_city.socr = street[1].decode('866')
                    street_city.code = street[2].decode('866')
                    street_city.zipcode = street[3].decode('866')
                    street_city.gni = street[4].decode('866')
                    street_city.okato = street[5].decode('866')
                    street_city.save()
                    
                    print (' '*20 + street_city.name) 
                    
            else:
                # поиск родителя в селах\деревнях
                code = code[:11]
                try:
                    parent_id = geo_places_list[code]
                except KeyError:
                    error_code_streets_list.append(code)
                else:
                    street_place = models.KladrStreet()
                    street_place.parent_id = int(parent_id['id'])
                    street_place.name = street[0].decode('866')
                    street_place.socr = street[1].decode('866')
                    street_place.code = street[2].decode('866')
                    street_place.zipcode = street[3].decode('866')
                    street_place.gni = street[4].decode('866')
                    street_place.okato = street[5].decode('866')
                    street_place.save()
                    
                    print (' '*20 + street_place.name)                   
                        
    print ('Take a bottle of champagne.Tables have been filled succesfully')     
    