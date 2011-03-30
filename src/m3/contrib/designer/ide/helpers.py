# coding: utf-8

import os
from m3.helpers.icons import Icons

EXCLUSION = ('pyc', 'orig',)
POSIBLE_EDIT_FILES = ('ui.py', 'forms.py')

def get_files(path):
    '''
    Возвращает список всех файлов в проекте
    @param path: Путь до директории с проектом 
    '''    
        
    li = []
         
    for ffile in sorted(os.listdir(path)):     

        if ffile.split('.')[-1]  in EXCLUSION:
            continue
                
        path_file =  os.path.join(path, ffile)
      
        propertys_dict = dict(text=ffile) 
        if os.path.isdir(path_file):                                    
            propertys_dict['children'] = get_files(path_file)
            propertys_dict['leaf'] = False             
        else:            
            propertys_dict['path'] = path_file
            propertys_dict['leaf'] = True            
            propertys_dict['iconCls'] = Icons.PAGE_WHITE_CODE if ffile in POSIBLE_EDIT_FILES \
                else Icons.PAGE_WHITE_TEXT
                 
        li.append(propertys_dict)
    return li
