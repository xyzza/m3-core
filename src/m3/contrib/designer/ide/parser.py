# coding: utf-8
'''
Created on 12.04.2011

@author: prefer
'''
import ast
import os
import json
import codecs
import codegen
import shutil # Для копирования файлов

# Для тестов 
import pprint

from advanced_ast import StringSpaces


#===============================================================================
# Класс исключительных ситуаций
class ParserError(Exception):
    def __init__(self, text):
        self.text = text

    def __str__(self):
        return self.text
    
    def __repr__(self):
        return self.text

#===============================================================================
class Parser(object):
    '''
    Класс, отвечающий за преобразование данных
    '''
    
    # Имя функция, которая будет сгенерирована
    GENERATED_FUNC = 'initialize'
    
    # Название папки для бакапа
    BACKUP_DIR_NAME = '.form-backup'
    
    # Сколько бакупных файлов хранить
    BACKUP_FILES_MAXIMUM = 10
    
    # Для юникода
    UNICODE_STR = '#coding: utf-8\n\n'
    
    # Док стринга для функции автогенерации
    GENERATED_FUNC_DOCSTRING = '''AUTOGENERATED'''
    
    # Откуда будут доступны все файлы
    IMPORT_ALL = 'm3.ui.ext.all_components'
    
    def __init__(self, path, class_name):
        '''
        @param path: Путь до py файла
        @param class_name: Имя класса для генерации
        '''
        
        # Путь до файла с исходным кодом
        self.path = path
        
        # Имя класса
        self.class_name = class_name
        
        # Базовый класс для окон (Если нет в маппинге)
        self.base_class = 'BaseExtWindow'
        
    @staticmethod
    def get_source_without_end_space(path):
        '''
        Убирает оконечные пробельные строки
        '''
        f_lines = open(path).readlines()
        lines = f_lines[:]
        
        
        f_lines.reverse()
        for line in f_lines:
            if str.isspace(line):
                lines.pop()
            else:
                break
                  
        return ''.join(lines)                
    
    def to_designer(self):
        '''
        Отвечает за преобразования py-кода в json, понятный m3-дизайнеру.
        Возвращает json объект в виде строки.
        '''

        # AST не дружит в конечными пробельными строками, поэтому убираем их и все пробельные строки за одно
        source_code = Parser.get_source_without_end_space(self.path)

        node_module = ast.parse(source_code)
        class_node, func_node = self._get_func_initialize(node_module, self.class_name)
        
        self.base_class = self._get_base_class(class_node)
                   
        if not func_node:
            raise ParserError('Функция автогенерации с названием "%s" не определена в классе "%s"' % 
                                (Parser.GENERATED_FUNC, self.class_name)    )
                
        self.config_cmp = {}
        self.extends_cmp = {}        
        for node in func_node.body:
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Name) and node.value.id not in ('True', 'False'):                                
                # Игнорирование значений, которые просто прописываются в объект
                if 'self' == node.targets[0].value.id:
                    continue
                
                # Составление структуры конфигов и типов компонентов
                parent, parent_item, item = self._get_attr(node)
                self.extends_cmp.setdefault(parent, {})[parent_item] =  item
            elif isinstance(node, ast.Assign):
                
                parent, attr, value = self._get_config_component(node)
                self.config_cmp.setdefault(parent, {})[attr] = value
                
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and node.value.args:

                parent, parent_item, items = self._get_extends(node.value)
                self.extends_cmp.setdefault(parent, {})[parent_item] =  items
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Str):
                # док. строки 
                pass
            else:
                raise ParserError("Синтаксис файла не поддерживается")

        return self._get_js()                                        

    def _get_js(self):
        js_dict = {}        
        #pprint.pprint(self.config_cmp) 
        self._build_json(js_dict)        
        return js_dict
        
            
    def _build_json(self, js_dict, key='self'):
        
        item = self.extends_cmp.get(key)
        
        js_dict.update( self._get_json_config(key) )
        if isinstance(item, dict):
            for k, v in item.items():
                if isinstance(v, list):
                    
                    l = []
                    for value in v:                    

                        if self.extends_cmp.get(value):                            
                            p = {}
                            l.append(p)                   
                            self._build_json(p, value)
                        else:                            
                            l.append(self._get_json_config(value))                            
            
                    extjs_item = self._get_json_attr(k, js_dict['type'])                    
                    if not extjs_item:
                        raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(k), js_dict['type']))
                                
                    js_dict[extjs_item] = l
                else: 
                    # Приходят property                    
                    extjs_item = self._get_json_attr(k, js_dict['type'])
                    if not extjs_item:
                        raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(k), js_dict['type']))  

                    # Объект может быть вложенный
                    if self.extends_cmp.get(v):                            
                        p = {}                 
                        self._build_json(p, v)                                                
                        js_dict[extjs_item] = p
                    else:                                                    
                        js_dict[extjs_item] = self._get_json_config(v)                    
        
        
    def _get_extends(self, node):
        parent =  node.func.value.value.id
        parent_item =  node.func.value.attr
                
        if not isinstance(node.args[0], ast.List):
            raise ParserError('Cинтаксис класса "%s" не поддерживается' % self.class_name)
        
        items = list(map(lambda x: x.id, node.args[0].elts))                
        return parent, parent_item, items
    
    def _get_attr(self, node):
        value = node.value.id
        parent_item =  node.targets[0].attr
        parent =  node.targets[0].value.id
        return parent, parent_item, value

    def _get_base_class(self, class_node):
        '''
        Получает базовый класс
        '''
        return class_node.bases[0].id
    
    def _get_json_config(self, key):
        '''
        Возвращает конфигурацию компонента в качестве словаря
        '''
        properties, py_name = self._get_properties(key)

        #print properties

        properties['type'] = py_name
        properties['id'] = key
        return properties

    def _get_properties(self, key):
        '''
        Возвращает кортеж: свойства контрола, имя контрола в натации дизайнера
        (extjs)
        '''
        conf = self.config_cmp[key].copy()
        py_name = conf.pop('py_name') if conf.get('py_name') else self.base_class
        
        extjs_name = self._get_extjs_class(py_name)

        if not extjs_name:
            raise ParserError('Не определен класс маппинга "%s"' % py_name)
        
        properties = dict(id= key) 
        for k, v in conf.items():         
            if isinstance(v, dict):
                # Обрабатываются комплексные компоненты
                extjs_attr, value = self._get_json_complex_attr(k, v, extjs_name)
                
                properties[extjs_attr] = value
            else:              
                extjs_attr = self._get_json_attr(k, extjs_name)            
                if not extjs_attr:
                    raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(k), extjs_name))
                  
                properties[extjs_attr] = v
            
        return properties, extjs_name
    
    def _get_json_complex_attr(self, name, value, extjs_class_name):
        '''
        Получается значение для комплексного компонента
        '''
        conf = self._gen_config(extjs_class_name)       
 
        for k, v in conf.items():                
            if isinstance(v, dict) and name == v['value'] and v['type'] == value['type']:                
                return str(k), value['value']
        else:
            raise ParserError('Комплексное свойство %s в классе %s не найдено' % (name, extjs_class_name) )
        
    def _get_extjs_class(self, py_name):
        '''
        Получает из маппинга наименование extjs класса 
        '''
        for item in self._get_mapping():
            k, v = item['class'].items()[0] # Одно значение
            if v == py_name:
                return str(k)
                    
    def _get_json_attr(self, name, extjs_class_name):
        '''
        Получает из маппинга свойство по наименованию extjs контрола
        '''
        conf = self._gen_config(extjs_class_name)        
        for k, v in conf.items():
            if v == name:
                return str(k)
        
    def _gen_config(self, type_obj):  
        '''
        Получение конфигурации свойств из маппинга по типу объекта
           @param type_obj: Тип объекта (window, panel, etc.)
        '''         
        for item in self._get_mapping():
            if item['class'].has_key(type_obj):
                return item['config']        
        
# append пока не поддерживается        
#    def _get_nested_component(self, node_value):
#        '''
#        Распарсивается структура вида:
#        self._items.append(panel)
#        
#        node_value.func.value.value.id - доступ к self
#        node_value.args[0].elts[0].id - доступ к panel
#        '''
#        assert isinstance(node_value, ast.Call)
#        
#        return node_value.func.value.value.id, node_value.args[0].id

    def _get_value(self, node):
        '''
        Получает значение исходя из типа узла
        '''
        return ast.literal_eval(node)

    def get_complex_property(self, node):
        '''
        Пробует распарсить комплексное свойство
        '''        
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Call) \
            and len(node.value.args) == 1 and isinstance(node.value.args[0], ast.Str):     
            # Маппинг для shortname
             
            # Чтобы потом при подстановки extjs названия полей выяснить, что
            # это поле нужно маппить отдельно                  
            return dict(type='shortname',value=node.value.args[0].s)
        else:
            raise ParserError('Некорректный синтаксис файла')


    def _get_config_component(self, node):
        '''
        Разбирает конструкцию вида:
        
        self.width = 100
        
        parent - self
        attr - width
        value - 100        
        '''        
        if not isinstance(node, ast.Assign):
            raise ParserError("Некорректный синтаксис файла")
        
        if isinstance(node.value, ast.Call):
            # Создание экземпляра            
            # instanse, attr, class name
            
            func = node.value.func
            if isinstance(func, ast.Attribute):
                if isinstance(node.targets[0], ast.Name):
                    return node.targets[0].id, 'py_name', '%s.%s' % (func.value.id ,func.attr)
                else:
                    # Пробуем разобрать комплексное свойство
                    
                    parent, attr =  node.targets[0].value.id, node.targets[0].attr                    
                    value = self.get_complex_property(func)
                    return parent, attr, value
                    
            elif isinstance(node.value.func, ast.Name):                
                return node.targets[0].id, 'py_name', func.id
            else:
                raise ParserError("Некорректный синтаксис файла")
        else:            
            # Распарсивание свойства
            # parent, attr, value
            return node.targets[0].value.id, node.targets[0].attr, self._get_value(node.value)        
    
    def from_designer(self, json_dict):
        '''
        Отвечает за преобразование json-a формы из m3-дизайнеру в py-код.
        '''

        # AST не дружит в конечными пробельными строками, поэтому убираем их и все пробельные строки за одно
        old_source_code = Parser.get_source_without_end_space(self.path)
        
        module_node = ast.parse(old_source_code)
        
        # Нахождение нужной функции GENERATED_FUNC
        class_node, func_node = self._get_func_initialize(module_node, self.class_name)
                
        nodes = Node(json_dict).get_nodes(self._get_mapping())

        # self._set_class_name(class_node, json_dict['type']) -- Не используется в данный момент
        
        # Старая док строка не должна потеряться
        if func_node and isinstance(func_node.body, list) and len(func_node.body) > 0 \
            and isinstance(func_node.body[0], ast.Expr):            
            nodes.insert(0, func_node.body[0])
            
        # Замена старого содержимого на новое сгенерированное 
        func_node.body = nodes + [StringSpaces(lines=2), ]
                
        begin_line, end_line = self._get_number_lines(module_node, class_node, func_node)

        # Бакап файла на всякий пожарный случай и cохранение нового файла
        source_code = codegen.to_source(func_node, indentation=1)
        
        self._write_to_file(source_code, begin_line, end_line)
        
    def _get_number_lines(self, module_node, class_node, func_node):
        '''
        Возвращает начало и конец функции Parser.GENERATED_FUNC_DOCSTRING
        '''
        begin_line = func_node.lineno
        
        # А вот с концом функции немного сложнее
        # Сначало проверим, есть ли еще методы в данном классе
        # Если нет, то то возьмем следующий узел module_node после класса
        for i, node in enumerate(class_node.body):            
            if node == func_node and len(class_node.body) > i+1:
                return begin_line, class_node.body[i+1].lineno
        else:
            for j, node in enumerate(module_node.body):
                if node == class_node and len(module_node.body) > j+1:
                    return begin_line, module_node.body[j+1].lineno
            else:
                return begin_line, None
    
    @staticmethod
    def from_designer_preview(json_dict):
        '''
        Преобразовывает js в py код и возвращает его в виде строки
        '''
        
        # Напрямую сбиндим объект маппинга
        nodes = Node(json_dict).get_nodes( mapping_list )

        list_source_code = map(codegen.to_source, nodes)
        return '\n'.join(list_source_code)

 
    def _set_class_name(self, node, extjs_type):
        '''
        Устанавливает соответсвующее имя класса наследника
        '''
        for item in self._get_mapping():
            k, v = item['class'].items()[0]
            if k ==  extjs_type:
                node.bases = [ast.Name( str(v), ast.Load())] 
                break
        
    def _write_to_file(self, source_code, begin_line, end_line):
        '''
        Запись в файл сгенерированного кода
        '''
        # 1. Создание директории, если нет
        # 2. Рекурсивное переименование всех имеющихся бакупных файлов в
        # файлы вида: .old.1, old.2, old.3
        # 3. Сохранение старого исходного кода с расширением old
        # 4. Перезапись файла новым содержимым
        
        dir = os.path.dirname(self.path)
        dir_backup = os.path.join(dir, Parser.BACKUP_DIR_NAME)
        if not os.path.isdir(dir_backup):
            os.mkdir(dir_backup)
        else:
            # Могут быть бакупные файлы, обход по времени последнего изменения
            for file_name in sorted(os.listdir(dir_backup), 
                                key=lambda f: os.stat(  os.path.join(dir_backup, f) ).st_mtime):
                file_path = os.path.join(dir_backup, file_name)
                                                 
                i = file_path.split('.')[-1]
                try:
                    int(i)
                except ValueError:
                    os.rename(file_path, '%s.%d' % (file_path, 0) )
                else:
                    if int(i)+1 > Parser.BACKUP_FILES_MAXIMUM:
                        os.remove(file_path) 
                    else:                       
                        file_name_parts = file_path.split('.')
                        without_end = file_name_parts[:-1]
                        os.rename(file_path, '%s.%d' % ('.'.join(without_end), int(i)+1) )
                    
        new_path = os.path.join(dir_backup, os.path.basename(self.path))        
        shutil.copyfile(self.path, new_path + '.old')

        f_lines = open(self.path, 'r').readlines()
        
        # Включаем и свою строку и пробельную строку выше
        end_l = f_lines[end_line-2:] if end_line else []

        with open(self.path, 'w') as f:            
            f.write(''.join(f_lines[:begin_line-1]) + source_code + ''.join(end_l))

    def _get_mapping(self):
        '''
        Получение объекта маппинга
        '''
        return mapping_list
        
    def _get_func_initialize(self, node_module, class_name):
        '''
        Поиск и возвращение функции GENERATED_FUNC 
        '''
        for node in node_module.body:        
            if isinstance(node, ast.ClassDef) and node.name == class_name:                
                for nested_node in node.body:    
                    if isinstance(nested_node, ast.FunctionDef) and nested_node.name == Parser.GENERATED_FUNC:
                        return node, nested_node
                else:
                    raise ParserError('Функция автогенерации с названием "%s" не \
                        определена в классе "%s"' % (Parser.GENERATED_FUNC, str(class_name)))
                    
    @staticmethod
    def generate_class(class_name, class_base):
        '''
        Генерирует класс
        Конструкция вида:
        class <class_name>(<class_base>):
            def __init__(self, *args, **kwargs):
                super(<class_name>).__init__(*args, **kwargs)
                self.<Parser.GENERATED_FUNC>()
                
            def <Parser.GENERATED_FUNC>(self):
                self.layout = 'auto'
        
        Возвращает сгенерированный узел AST
        '''
        # Лисп ёпта
        node_constructor = ast.Expr(
                                ast.Call(
                                    ast.Attribute(
                                        ast.Call(
                                            ast.Name('super', 
                                                     ast.Load()
                                            ),
                                            [ast.Name( 
                                                str(class_name),
                                                ast.Load()
                                             ),
                                             ast.Name(
                                                 'self',
                                                 ast.Load()
                                             )],
                                            [],
                                            None,
                                            None
                                        )
                                         ,'__init__',
                                         ast.Load()
                                    )
                                    ,[]
                                    ,[]
                                    ,ast.Name(
                                        'args',
                                        ast.Load()
                                    ),
                                    ast.Name(
                                        'kwargs',
                                        ast.Load()
                                    )
                                )
                            )
        node_initial = ast.Expr(
                                ast.Call(
                                    ast.Attribute(
                                        ast.Name(
                                            'self',
                                            ast.Load()
                                        ),
                                        Parser.GENERATED_FUNC,
                                        ast.Load()                                              
                                    ),
                                    [],     
                                    [],
                                    None,
                                    None,
                                )
                            )
    
        contstructor_args = ast.arguments([ast.Name('self', ast.Load())], 
                                          'args', 
                                          'kwargs', 
                                          [])    
        
        constructor_func = ast.FunctionDef('__init__',
                                            contstructor_args, 
                                            [node_constructor, node_initial], 
                                            [])
    
    
        initial_args = ast.arguments([ast.Name('self', ast.Load())], 
                                     None, 
                                     None, 
                                     [])
            
        initial_nodes = [ast.Assign(
                                [ast.Attribute(
                                    ast.Name('self', ast.Load()), 
                                    'layout', 
                                    ast.Load()
                                  )],
                                 ast.Str('auto')) ]
        
        doc_str = ast.Expr(
                    ast.Str(Parser.GENERATED_FUNC_DOCSTRING)
                    )
        initialize_func = ast.FunctionDef(Parser.GENERATED_FUNC, 
                                          initial_args, 
                                          [doc_str,] + initial_nodes, 
                                          [])
            
        cl = ast.ClassDef(
                    str(class_name), 
                    [ast.Name(class_base, ast.Load())], 
                    [constructor_func, initialize_func,], 
                    [])
        
        return cl
    
    
    @staticmethod
    def generate_import():
        '''
        Генерирует узел AST, который преобразуется в 
        
        from m3.ui.ext.all_components import *
        '''
        return ast.ImportFrom(Parser.IMPORT_ALL, [ast.alias(name='*')], 0)
        
class Node(object):
 
    mapping = None
 
    def __init__(self, data):        
        self.data = data                            

    @staticmethod
    def sort_items(items):
        key, item = items
        if isinstance(item, list):
            return 100
        elif isinstance(item, dict):
            return 10
        elif key == 'id':            
            return 0
        else:            
            return 1


    def get_nodes(self, mapping):
        '''
        '''
        Node.mapping = mapping
        
        nodes = []
        nodes_attr = []
        nodes_extends = [] 
        nodes_in_self = []
        
        self.walk(nodes, nodes_attr, nodes_extends, nodes_in_self)
        
        if nodes_attr:
            nodes_attr.insert(0, StringSpaces())
            nodes += nodes_attr
            
        if nodes_extends:
            nodes_extends.insert(0, StringSpaces())
            nodes += nodes_extends
            
        if nodes_in_self:
            nodes_in_self.insert(0, StringSpaces())
            nodes += nodes_in_self
        
        return nodes

    def walk(self, nodes, nodes_attr, nodes_extends, nodes_in_self):        
          
        for key, value in sorted(self.data.items(), key=Node.sort_items):
            if isinstance(value, list):
                extends_list = []
                for item in value:
                    if isinstance(item, dict) and item.has_key('id') and item.has_key('type'):
                        Node(item).walk(nodes, nodes_attr, nodes_extends, nodes_in_self)
                        extends_list.append(item['id'])
                    else:
                        ast_node = self._get_property(self.data['id'], key, value, self.data['type'])
                        nodes.append(ast_node)
                        break
                
                if extends_list:
                    ast_node = self._get_extends(self.data['id'], key, extends_list, self.data['type'])                    
                    nodes_extends.append(ast_node)
            elif isinstance(value, dict) and value.has_key('type') and value.has_key('id'):                
                Node(value).walk(nodes, nodes_attr, nodes_extends, nodes_in_self)             
                
                ast_node = self._get_attr(self.data['id'], key, value['id'], self.data['type'])
                
                nodes_attr.append(ast_node)
            else:
                if key == 'type' or value == 'self':
                    continue
                elif key == 'id' and value != 'self':                                                   
                    ast_node = self._get_instanse(self.data['type'], value)                                        
                    nodes.extend([StringSpaces(), ast_node, ])
                    
                    in_self_node = self._add_cmp_in_self(value)                    
                    nodes_in_self.append(in_self_node)                                
                else:                    
                    ast_node = self._get_property(self.data['id'], key, value, self.data['type'])
                    nodes.append(ast_node)                            
     
    def _add_cmp_in_self(self, field, parent_fields='self'):
        return ast.Assign(
                [ast.Attribute(
                        ast.Name(parent_fields, ast.Load()), 
                        str(field), 
                        ast.Load()
                    )], 
                ast.Name(field, ast.Load())
            )
    
    def _get_complex_field(self, py_attr, value):
        '''
        Преобразует сложные проперти
        '''
        if py_attr['type'] == 'shortname':
            # Преобразует шортнэймы
            attr = py_attr['value']
            
            func = ast.Call(
                        func=ast.Attribute(
                            attr='get_absolute_url'
                            ,value=ast.Call(
                                    args=[ast.Str(value)]
                                    ,func=ast.Attribute(
                                        attr='get_action'
                                        ,value=ast.Name(
                                            id='urls'
                                            ,ctx=ast.Load()      
                                        )
                                        ,ctx=ast.Load()
                                    )                                    
                                    ,keywords=[]
                                    ,kwargs=None
                                    ,starargs=None  
                                )
                            ,ctx=ast.Load()                  
                        )
                        ,args=[]
                        ,keywords=[]
                        ,kwargs=None
                        ,starargs=None                       
                    ) 
            
            
            return str(attr), func
        else:
            raise ParserError('Комплексное свойство "%s" не поддерживается') % py_attr['type']
    
    def _get_property(self, parent_field, extjs_attr, value, extjs_class):
        for item in self.mapping:
            if item['class'].has_key(extjs_class):
                                
                if not item['config'].get(extjs_attr):
                    raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(extjs_attr) , extjs_class))
                
                py_attr = item['config'][extjs_attr]
                
                if isinstance(py_attr, dict):
                    # Сложное свойство
                    
                    attr, attr_value = self._get_complex_field(py_attr, value)
                    
                    return ast.Assign(
                        [ast.Attribute(
                            ast.Name(parent_field, ast.Load()), 
                            attr, 
                            ast.Load()
                        )], 
                        attr_value
                    )
                else:
                    return ast.Assign(
                        [ast.Attribute(
                            ast.Name(parent_field, ast.Load()), 
                            str(py_attr), 
                            ast.Load()
                        )], 
                        self._get_node_value(value)
                    )
        else:
            raise ParserError("Не определен объект маппинга для класса '%s'" % extjs_class) 
    
    def _get_instanse(self, extjs_class, value):
        for item in self.mapping:
            if item['class'].has_key(extjs_class):
                instanse_name = item['class'][ extjs_class ]
                                                           
                if value.find(" ") > 0:
                    raise ParserError('Переменная "%s" не может содержать пробелы' % value)
                
                return ast.Assign([ast.Name( 
                                        value, 
                                        ast.Load()
                                  )], 
                                  ast.Call(
                                        ast.Name( 
                                            str(instanse_name) , 
                                            ast.Load()
                                        ), 
                                        [], 
                                        [], 
                                        None, 
                                        None)
                                  )
        else:
            raise ParserError("Не определен объект маппинга для класса '%s'" % extjs_class) 
    
    def _get_attr(self, parent_field, extjs_attr, value, extjs_class):
        for item in self.mapping:
            if item['class'].has_key(extjs_class):
                                
                if not item['config'].get(extjs_attr):
                    raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(extjs_attr), extjs_class))
                
                py_attr = item['config'][extjs_attr]
                return ast.Assign(
                    [ast.Attribute(
                        ast.Name(parent_field, ast.Load()), 
                        str(py_attr), 
                        ast.Load()
                    )], 
                    ast.Name(value, ast.Load())
                )
        else:            
            raise ParserError('Не определен класс маппинга "%s"' % extjs_class)
    

    def _get_extends(self, parent_field, extjs_name, list_cmp, extjs_class):        
        for item in self.mapping:
            if item['class'].has_key(extjs_class):
                                
                if not item['config'].get(extjs_name):
                    raise ParserError('Не определен объект маппинга "%s" для класса "%s"' % ( str(extjs_name), extjs_class))                
                
                py_attr = item['config'][extjs_name]
                 
                ast_list = ast.List([ast.Name(item, ast.Load() ) for item in list_cmp], ast.Load())                                                                
                return ast.Expr( 
                            ast.Call(
                                ast.Attribute(
                                    ast.Attribute(
                                        ast.Name(
                                            parent_field,
                                            ast.Load()
                                        ),
                                        str(py_attr),
                                        ast.Load()       
                                    ),
                                    'extend',
                                    ast.Load()          
                                ),     
                                [ast_list,],
                                [],     
                                None,
                                None
                            )
                        )
        else:
            raise ValueError("Mapping is undefined for class '%s'" % extjs_class)            

    def _get_node_value(self, value):
        '''
        Генерация узла дерева для простых элементов
        Например для строки и числа, булевого типа
        '''        
        if value in ('False', 'True'):
            return ast.Name(value, ast.Load())
        elif isinstance(value, int):
            return ast.Num(value)
        elif isinstance(value, basestring):
            return ast.Str(value)
        elif isinstance(value, dict):
            return ast.Dict( [ self._get_node_value(str(k))  for k in value.keys()],
                             [ self._get_node_value(v) for v in value.values()] )
            
        elif isinstance(value, tuple):
            return ast.Tuple([self._get_node_value(item) for item in value], ast.Load())
               
        elif isinstance(value, list):
            return ast.List([self._get_node_value(item) for item in value], ast.Load())
        
        raise ParserError('Некорректный синтаксис: тип "%s" со значением "%s" не поддерживается' % (type(value), value))                     
                    
def update_with_inheritance(m_list, parent=None, config=None):
    '''
    Обновляет маппинг объектов с учетом наследование, то есть дозополняет
    свойствами объекты из унаследованных классов "parent"
    '''        
    
    for item in m_list:
        if parent and item.get('class').keys()[0] == parent:    
            
            # Для того, чтобы родительские свойства не перекрывали свойства объекта
            tmp_dict = config.copy() 
            config.update(item['config'])
            config.update(tmp_dict)
            break
        elif not parent and item.get('parent'):
            update_with_inheritance(m_list, item.get('parent'), item['config'])

# Для избавления от комментов делим файл на строки
def open_text_file(filename, mode='r', encoding = 'utf-8'):
    '''
    Для открытия файла, если он был сохранен под виндами. Бомы всякие удаляются.
    '''
    has_BOM = False
    if os.path.isfile(filename):
        f = open(filename,'rb')
        header = f.read(4)
        f.close()
        
        # Don't change this to a map, because it is ordered
        encodings = [ ( codecs.BOM_UTF32, 'utf-32' ),
            ( codecs.BOM_UTF16, 'utf-16' ),
            ( codecs.BOM_UTF8, 'utf-8' ) ]
        
        for h, e in encodings:
            if header.startswith(h):
                encoding = e
                has_BOM = True
                break
        
    f = codecs.open(filename,mode,encoding)
    # Eat the byte order mark
    if has_BOM:
        f.read(1)
        
    return f

def get_mapping():
    '''
    Возвращает строковое представление маппинга
    '''
    f = open_text_file(os.path.join(os.path.dirname(__file__), 'mapping.json'))
    return ''.join(filter(lambda x: not '//' in x, f.xreadlines()))

# Словарь сопоставлений контролов в дизайнере к контролам в питоне
mapping_list = json.loads( get_mapping() )

# Рекурсивное добавление свойств у классов наследников
update_with_inheritance(mapping_list)

#===============================================================================
def test_from_designer():
    '''
    С новым протоколом
    '''
    fake_data = {
        'name':'Ext window',
        'title':'Trololo',
        'layout':'fit',

        'type':'window',
        'id':'self',
        
        'items': [{
                'type': 'panel',
                'id': 'base_panel',
                
                'name':'Ext panel',
                'title':'Im panel ',
                'layout':'absolute',
                'items': [{
                    'type': 'gridPanel',
                    'id': 'grid_1',                      
                    'store': {
                        'id': 'store1'
                        ,'type':'arrayStore'
                    },
                      
                    'tbar':{
                            'id': 'tbar_1'
                            ,'type':'toolbar'
                            ,'items':[{
                                'type':'button'
                                ,'id':'button_1'
                                ,'text':u'Кнопка 1'
                            },{
                               'type':'button'
                                ,'id':'button_2'
                                ,'text':u'Кнопка 2'                            
                            }]
                    }
                    ,'columns': [{
                        'type': 'gridColumn',
                        'id': 'gridColumn_1',
                        'header': '2'  
                    },{
                       'type': 'gridColumn',
                        'id': 'gridColumn_2',
                        'header': '1'
                    }]     
                           
                }]
            }]
    }
        
    Node.mapping = mapping_list
    nodes = Node(fake_data).walk()

    list_nodes_str = map(codegen.to_source, nodes)
    print '\n'.join(list_nodes_str)         
    print '====== from_designer - ok ======'    
    
def test_to_designer(class_name='TestOne'):
    '''
    Для тестирования метода to_designer
    '''
    js = Parser('tests.py', class_name).to_designer()        
    pprint.pprint( js ) 
    
    print 'Parser.to_designer - ok'
