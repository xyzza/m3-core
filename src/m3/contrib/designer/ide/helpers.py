# coding: utf-8

import ast
import os
import json
import codegen

# Для тестов обернуто в try
try:
    from m3.helpers.icons import Icons
except ImportError:
    pass


EXCLUSION = ('pyc', 'orig',)
POSIBLE_EDIT_FILES = ('ui.py', 'forms.py')


class Parser(object):
    '''
    Класс, отвечающий за преобразование данных
    '''
    
    # Имя функция, которая будет сгенерирована
    GENERATED_FUNC = 'initialize'
    
    def __init__(self, path, class_name):
        '''
        @param path: Путь до py файла
        @param class_name: Имя класса для генерации
        '''
        self.path = path
        self.class_name = class_name
        
        # Содержаться вложенные объекты для последующей генерации
        # Пример:
        # {'self':[{'simple_panel':[...]},{'simple_form':[...]}]}
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
                
        # Получение узлов AST непосредственно для класса (например свойства ExtWindow)
        nodes = self._gen_base_properties(json_dict)
        
        # Получение узлов AST для дочерних элементов (вложенные объекты)
        child_nodes = self._gen_child_properties(json_dict)
        
        # Добавление дочерних узлов в список узлов свойств
        nodes.extend(child_nodes)
                
        # Добавление вложенных компонентов (строки вида: self._items.append(...) )
        nodes.extend( self._gen_nested_components() )        

        # Преобразование модуля в AST дерево
        module_node = ast.parse(open(self.path).read())
        
        # Нахождение нужной функции GENERATED_FUNC
        func_node = self._get_func_initialize(module_node, self.class_name)     
        
        # Старая док строка не должна потеряться
        if func_node and isinstance(func_node.body, list) and len(func_node.body) > 0 \
            and isinstance(func_node.body[0], ast.Expr):            
            nodes.insert(0, func_node.body[0])
            
        # Замена старого содержимого на новое сгенерированное 
        func_node.body = nodes
        
        
        print codegen.to_source(module_node)

        # Бакап файла на всякий пожарный случай
        
        # Сохранение нового файла

        
    def _gen_nested_components(self, d=None, nodes=None):
        '''
        Генерирует список узлов AST вложенных компонент вида:
        self._items.append(spanel)
        spanel._items.append(code)
        spanel._items.append(descr)
        
        При этом рекурсивно спускается по структуре вида
        {'self':[{'simple_panel':[...]},{'simple_form':[...]}]}
        
        @param d: словарь, структуру которого необходимо отобразить
        @param param: nodes - для передачи нодов внутрь функции
        
        @return: nodes - Возвращает набор узлов
        '''
        nodes = nodes or []
        d = d or self.dict_instances        
        for k, v in d.items(): # Вызывается 1 раз, т.к. 1 ключ
            for item in v: # Обход списка вложенных контролов               
                for ik, _ in item.items(): # Вызывается 1 раз, для получения внутреннего ключа
                    
                    # Вот такая ебическая конструкция
                    # Привыкаем, блеать, к лиспу (с) greatfuckingadvice
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
                        
                    self._gen_nested_components(item, nodes)
        
        return nodes    
        
    
    def _gen_child_properties(self, type_obj, nodes = None, dict_instanses=None):
        '''
        Генерация узлов AST для свойств дочерних элементов 
        
        Рекурсивно вызывается для вложенных объектов
        
        Строки вида: 
        panel = ExtPanel()
        panel.title = u'Панелько'
        ...
        my_field = ExtStringField()
        my_field.label = 'my_label'
        '''
        nodes = nodes or []
        dict_instanses = dict_instanses or self.dict_instances
        
        # li - вспомогательный список, укороченная ссылка на dict_instanses[ type_obj['id'] ]
        dict_instanses[ type_obj['id'] ] = li = []
 
        if type_obj.has_key('items'):
            for item in type_obj['items']:
                d = {item['id']: []}             
                li.append(d)
                
                nodes.append( self._gen_instanse(item) )
                nodes.extend( self._gen_base_properties(item) )                    
                
                self._gen_child_properties(item, nodes, dict_instanses=d)

        return nodes
    
    def _gen_instanse(self, obj):
        '''
        Получение по маппингу 
        Строки вида: 
        panel = ExtPanel()
        '''
        for item in self._get_mapping():            
            if item['class'].has_key(obj['type']):
                value = item['class'][ obj['type'] ]
                return ast.Assign([ast.Name(obj['id'], '1')], 
                                  ast.Call(
                                        ast.Name( str(value) , 1), [], [], None, None)
                                  )
    
    def _gen_base_properties(self, type_obj):
        '''
        Генерация узлов для свойств 
        Строки вида:
        self.width = 100
        self.title = u'Окошко'
        
        panel.title = 'Simple title'
        '''
        config_dict = self._gen_config(type_obj['type'])
        properties = type_obj['properties']
        
        nodes = []
        for extjs_name, value in properties.items():
            
            # Вложенные id не учитываем
            if str(extjs_name) == 'id':
                continue
            
            assert type_obj.get('id'), 'ID component "%s" is not defined' % type_obj['type']
            assert config_dict, 'Mapping component "%s" (%s) is not define' % (type_obj['type'], type_obj['id']) 
            assert config_dict.get(extjs_name), 'Mapping object "%s" for "%s" is not define' % (extjs_name, type_obj['id'])

            py_name = config_dict[extjs_name]
            
            node = ast.Assign([ast.Attribute(ast.Name(type_obj['id'], '1'), str(py_name), '1')], self._get_node_value(value))
            nodes.append(node)
            
        return nodes
    
    def _gen_config(self, type_obj):  
        '''
        Получение конфигурации свойств из маппинга по типу объекта
        @param type_obj: Тип объекта (window, panel, etc.)
        '''         
        for item in self._get_mapping():
            if item['class'].has_key(type_obj):
                return item['config']
    
    
    def _get_mapping(self):
        '''
        Получение объекта маппинга
        '''
        return mapping_list
    
    def _get_node_value(self, value):
        '''
        Генерация узла дерева для простых элементов
        Например для строки и числа
        '''
        if isinstance(value, int):
            return ast.Num(value)
        elif isinstance(value, basestring):
            return ast.Str(value)
        
        
    def _get_func_initialize(self, node_module, class_name):
        '''
        Поиск и возвращение функции GENERATED_FUNC 
        '''
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


def restores(data):
    '''
    Будет пытаться преобразить все символы в кодировку ascii, если это 
    невозможно - если присутсвует unicode символы, то оcтавляет их как есть
    '''
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
        

# Словарь сопоставлений контролов в дизайнере к контролам в питоне
mapping_list = json.loads(open( 
                    os.path.join(os.path.dirname(__file__), 'mapping.json'), 'r').read())


#===============================================================================
def test_from_designer():
    '''
    Функция для легкого тестирования метода from_designer
    '''
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
    
    Parser('tests.py', 'TestOne').from_designer(fake_data)
    print 'Parser.from_designer - ok'
    
    
if __name__ == '__main__':
    test_from_designer()