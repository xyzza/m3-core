# coding: utf-8

import ast
import os
import json
import codegen

try:
    from m3.helpers.icons import Icons
except:
    pass

EXCLUSION = ('pyc', 'orig',)
POSIBLE_EDIT_FILES = ('ui.py', 'forms.py')



class Parser(object):
    '''
    Класс, отвечающий за преобразование данных
    '''
    
    # Функция 
    GENERATED_FUNC = 'initialize'
    
    def __init__(self, path, class_name):
        self.path = path
        self.class_name = class_name
        
        
        self.dict_instances = {}
    
    def to_designer(self):
        '''
        Отвечает за преобразования py-кода в json, понятный m3-дизайнеру.
        Возвращает json объект в виде строки.
        '''
        pass
    

    def from_designer(self, json_dict):
        '''
        Отвечает за преобразование json-a формы из m3-дизайнеру в py-код.
        '''
        
        # Опишем действия для окна
        # 1. Получение конфига сопоставлений
        nodes = self.gen_base_properties(json_dict)
        
        child_nodes = self.gen_child_properties(json_dict)
        
        #print child_nodes
        
        print self.dict_instances
        
        #return 
    
        nodes.extend(child_nodes)
                
        # Добавление вложенных компонентов
        
        
        nodes.extend( self.gen_nested_components() )
        #return 
        #nodes.extend( self.gen_nested_components() )
                
        module_node = ast.parse(open(self.path).read())
        func_node = self.get_func_initialize(module_node, self.class_name)     
                
        if func_node and isinstance(func_node.body, list) and len(func_node.body) > 0 \
            and isinstance(func_node.body[0], ast.Expr):            
            # Включение докстроки 
            nodes.insert(0, func_node.body[0])
            
        func_node.body = nodes
        
        print module_node
        print codegen.to_source(module_node)
        
        # 2. Построение вложенных элементов
        # ast.Assign([ast.Attribute(ast.Name('a','1'), 'a', '1')], ast.Num(5))

        
    def gen_nested_components(self, d=None, nodes=None):
        nodes = nodes or []
        d = d or self.dict_instances        
        for k, v in d.items(): # Вызывается 1 раз, т.к. 1 ключ
            for item in v: # Обход списка вложенных контролов               
                for ik, _ in item.items(): # Вызывается 1 раз, для получения внутреннего ключа
                    
                    # Вот такая ебическая конструкция
                    # Привыкаем блять к лиспу (с) greatfuckingadvice
                    node = ast.Expr(
                                ast.Call(
                                    ast.Attribute(
                                        ast.Attribute(
                                            ast.Name(k, 1), 
                                            '_items', 1),
                                        'append' , 1),
                                [ast.Name(ik, 1), ], [], None, None)
                            )
                    nodes.append(node)
                        
                    self.gen_nested_components(item, nodes)
        
        return nodes    
        
    
    def gen_child_properties(self, type_obj, nodes = None, dict_instanses=None):
        
        nodes = nodes or []
        dict_instanses = dict_instanses or self.dict_instances
        
        dict_instanses[ type_obj['id'] ] = li = []
 
        for item in type_obj['items']:
            d = {item['id']: []}             
            li.append(d)
            
            nodes.append( self.gen_instanse(item) )
            nodes.extend( self.gen_base_properties(item) )                    
            
            self.gen_child_properties(item, nodes, dict_instanses=d)

        return nodes
    
    def gen_instanse(self, obj):
        for item in self.get_mapping():            
            if item['class'].has_key(obj['type']):
                value = item['class'][ obj['type'] ]
                return ast.Assign([ast.Name(obj['id'], '1')], ast.Call(ast.Name(str(value), 1), [], [], None, None))
    
    def gen_base_properties(self, type_obj):
        #print type_obj['type']
        config_dict = self.gen_config(type_obj['type'])
        properties = type_obj['properties']
        
        nodes = []
        for extjs_name, value in properties.items():
            py_name = config_dict[extjs_name]
            node = ast.Assign([ast.Attribute(ast.Name(type_obj['id'], '1'), str(py_name), '1')], self.get_node_value(value))
            nodes.append(node)
            
        return nodes
    
    def gen_config(self, type_obj):           
        for item in self.get_mapping():
            if item['class'].has_key(type_obj):
                return item['config']
    
    
    def get_mapping(self):
        return mapping_list
    
    def get_node_value(self, value):
        if isinstance(value, int):
            return ast.Num(value)
        elif isinstance(value, basestring):
            return ast.Str(value)
        
        
    def get_func_initialize(self, node_module, class_name):
        for node in ast.walk(node_module):            
            if isinstance(node, ast.ClassDef) and node.name == class_name:                
                for node in ast.walk(node):
                    if isinstance(node, ast.FunctionDef) and node.name == Parser.GENERATED_FUNC:
                        return node
                        
        
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
    
    ast_module = ast.parse( open(path).read() )
    
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

# Словарь сопоставлений контролов в дизайнере к контролам в питоне
mapping_list = json.loads(open( os.path.join(os.path.dirname(__file__), 'mapping.json'), 'r').read())


def test_from_designer():
    
    fake_data = {
        'properties': {
            'name':'Ext window',
            'title':'Trololo',
            'layout':'fit',
        },
        'type':'window',
        'id':'self',
        'items': [{
            'properties': {
                'name':'Ext panel',
                'title':'Im panel ',
                'layout':'absolute'
            },
            'type': 'panel',
            'id': 'base_panel',
            'items': []
        }, {
            'properties': {
                'name':'Ext form',
                'title':'Im form ',
                'layout':'form'
            },
            'type': 'form',
            'id': 'simple_form',
            'items': [{
                'properties': {
                    'name':'Ext panel',
                    'title':'Im panel 2',
                    'layout':'absolute 2',
                    'width': 100
                },
                'type': 'panel',
                'id': 'inner_panel',
                'items': []
            }]
        }]
    }
    
    parser = Parser('tests.py', 'TestOne')
    parser.from_designer(fake_data)