# coding: utf-8

import ast
import os
import codegen

from parser import Parser
from m3.helpers.icons import Icons


EXCLUSION = ('pyc', 'orig',)
POSIBLE_EDIT_FILES = ('ui.py', 'forms.py')

        
def get_files(path):
    '''
    Возвращает список всех файлов в проекте
    @param path: Путь до директории с проектом 
    '''    
        
    li = []
 
    for ffile in sorted(os.listdir(path), \
            # Папки имеют приоритет над файлами
            key=lambda x: ' %s' % x if os.path.isdir(os.path.join(path, x)) else x):

        if ffile.split('.')[-1]  in EXCLUSION:
            continue
                
        # Никаких крокозябр - unicode(..)
        path_file = unicode( os.path.join(path, ffile) )
        
        propertys_dict = dict(text=ffile) 
        if os.path.isdir(path_file):                                    
            propertys_dict['children'] = get_files(path_file)
            propertys_dict['leaf'] = False             
        else:            
            propertys_dict['path'] = path_file
                                                    
            if ffile in POSIBLE_EDIT_FILES:
                propertys_dict['iconCls'] = Icons.PAGE_WHITE_CODE
                propertys_dict['leaf'] = False
            else:
                propertys_dict['iconCls'] = Icons.PAGE_WHITE_TEXT
                propertys_dict['attr'] = path_file
                propertys_dict['leaf'] = True
                 
        li.append(propertys_dict)

    return li


def get_classess(path):
    '''
    Возвращает набор классов в файле
    '''
    with open(path) as f:
        ast_module = ast.parse( f.read() )
        
        res = []
        for item in ast.walk( ast_module ):
            if isinstance(item, ast.ClassDef):
                d = {'text': item.name,
                     'leaf': True,
                     'iconCls':  Icons.PAGE_WHITE_C,
                     'class_name':  item.name,
                     'path': path}
                res.append(d)
            
        return res


def restores(data):
    '''
    Будет пытаться преобразить все символы в кодировку ascii, если это 
    невозможно - если присутсвует unicode символы, то оcтавляет их как есть
    '''
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, dict):
                restores(v)
            elif isinstance(v, list):
                map(restores, v)
            else:
                try:
                    data[k] = str(v)
                except UnicodeEncodeError:
                    pass # Итак останется в unicode
    else:
        # Для списков значений
        return data
               
        
def create_py_class(path, class_name, base_class = 'ExtWindow'):
    '''
    Создает класс с функцией автогенерации
    '''
    
    assert class_name.find(" ") == -1, 'Class name "%s" can"t has whitespace' % class_name
    try:
        str(class_name)
    except UnicodeEncodeError:
        raise Exception('Class name "%s" can"t has unicode symbols' % class_name)

    cl = Parser.generate_class(class_name, base_class)
     
    # Чтение файла    
    f = open(path, 'r')
    module = ast.parse(f.read())
    module.body.append(cl)
    f.close()
    
    # Запись
    f = open(path, 'w')
    source_code = codegen.to_source(module)    
    f.write(Parser.UNICODE_STR + source_code)
    f.close()
