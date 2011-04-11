# coding: utf-8

import ast
import os
import json
import codegen
import shutil # Для копирования файлов

# Для тестов 
import pprint

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
    
    # Название папки для бакапа
    BACKUP_DIR_NAME = '.form-backup'
    
    # Сколько бакупных файлов хранить
    BACKUP_FILES_MAXIMUM = 10
    
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
        
        # Старый исходный код модуля
        self.old_source_code = ''
        
        #
        self.base_class = 'BaseExtWindow'
        
    def to_designer(self):
        '''
        Отвечает за преобразования py-кода в json, понятный m3-дизайнеру.
        Возвращает json объект в виде строки.
        '''
        source_code = open(self.path).read()
        node_module = ast.parse(source_code)
        class_node, func_node = self._get_func_initialize(node_module, self.class_name)
        
        self.base_class = self._get_base_class(class_node)
        
        
        assert func_node, 'Function name "%s" is not define in class "%s"' % \
                        (Parser.GENERATED_FUNC, self.class_name,)
        
        self.nested_cmp = {}
        self.config_cmp = {}
        for node in func_node.body:
            if isinstance(node, ast.Assign):
                # Составление структуры конфигов и типов компонентов
                parent, attr, value = self._get_config_component(node)
                self.config_cmp.setdefault(parent, {})[attr] = value
                
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
                # Составление структуры вложенных компонентов
                parent, child = self._get_nested_component(node.value)
                self.nested_cmp.setdefault(parent, []).append(child)
                        
        return self._get_json()        

    def _get_base_class(self, class_node):
        '''
        Получает базовый класс
        '''
        return class_node.bases[0].id

    def _get_json(self, key='self', a_property_dict=None):
        '''
        Преобразует линейную структуру вида:
            {'panel1': ['field1'], 'self': ['panel1', 'panel2']}
        в иерархическую структуру вида:
            {'self':[{'panel1': ['field1']}, {'panel2': []}]}  
            
        И попутно преобразует py-объекты в объекты дизайнера
        В конечном итоге получается словарь, понятный дизайнеру  
        '''
        res_dict = a_property_dict if isinstance(a_property_dict, dict) else {}                
               
        tmp_list = []
        if self.nested_cmp and self.nested_cmp.get(key):
            for item in self.nested_cmp[key]:

                property_dict = {}      
                if self.nested_cmp.get(item):
                    res_dict.setdefault('items', []).append(property_dict)
                    self._get_json(item, property_dict)                                               
                else:
                    property_dict.update( self._get_json_config(item ) )    

                tmp_list.append(property_dict)
        
        res_dict.update(self._get_json_config(key))    
        res_dict.update({'items': tmp_list})
        return res_dict
    
    def _get_json_config(self, key):
        '''
        Возвращает конфигурацию компонента в качестве словаря
        '''
        properties, py_name = self._get_properties(key)                
        return {'type': py_name, 'id':key, 'properties': properties}

    def _build_conf(self):
        '''
        Собирает конфиг маппинга рекурсивно обходя родительские компоненты
        '''


    def _get_properties(self, key):
        '''
        Возвращает кортеж: свойства контрола, имя контрола в натации дизайнера
        (extjs)
        '''        
        conf = self.config_cmp[key].copy()

        if conf.get('py_name'):
            py_name = conf.pop('py_name')            
        else:
            py_name = self.base_class
        
        extjs_name = self._get_extjs_class(py_name)
        assert extjs_name, 'Mapping for class "%s" is not define' % py_name
        
        properties = dict(id= key) 
        for k, v in conf.items():            
            extjs_attr = self._get_json_attr(k, extjs_name)            
            assert extjs_attr, 'Mapping object "%s" for "%s" is not define' % (k, extjs_name,)
            properties[extjs_attr] = v
            
        return properties, extjs_name
    
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
        
    def _get_nested_component(self, node_value):
        '''
        Распарсивается структура вида:
        self._items.append(panel)
        
        node_value.func.value.value.id - доступ к self
        node_value.args[0].elts[0].id - доступ к panel
        '''
        assert isinstance(node_value, ast.Call)
        
        return node_value.func.value.value.id, node_value.args[0].id

    def _get_value(self, node):
        '''
        Получает значение исходя из типа узла
        '''
        if isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.Str):
            return node.s

    def _get_config_component(self, node):
        '''
        Разбирает конструкцию вида:
        
        self.width = 100
        
        parent - self
        attr - width
        value - 100        
        '''
        assert isinstance(node, ast.Assign)#        
        if isinstance(node.value, ast.Call):
            # Создание экземпляра            
            # instanse, attr, class name
            return node.targets[0].id, 'py_name', node.value.func.id
        else:            
            # Распарсивание свойства
            # parent, attr, value
            return node.targets[0].value.id, node.targets[0].attr, self._get_value(node.value)        
    
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
        self.old_source_code = open(self.path).read()
        module_node = ast.parse(self.old_source_code)
        
        # Нахождение нужной функции GENERATED_FUNC
        class_node, func_node = self._get_func_initialize(module_node, self.class_name)
        
        self._set_class_name(class_node, json_dict['type'])
        
        # Старая док строка не должна потеряться
        if func_node and isinstance(func_node.body, list) and len(func_node.body) > 0 \
            and isinstance(func_node.body[0], ast.Expr):            
            nodes.insert(0, func_node.body[0])
            
        # Замена старого содержимого на новое сгенерированное 
        func_node.body = nodes                       

        # Бакап файла на всякий пожарный случай и cохранение нового файла
        source_code = codegen.to_source(module_node)        
        self._write_to_file(source_code)
        
    def _set_class_name(self, node, extjs_type):
        '''
        Устанавливает соответсвующее имя класса наследника
        '''
        for item in self._get_mapping():
            k, v = item['class'].items()[0]
            if k ==  extjs_type:
                node.bases = [ast.Name( str(v), 1)] 
                break
        
    def _write_to_file(self, source_code):
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
                    
        with open(self.path, 'w') as f:
            f.write(source_code)

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
        for k, v in d.items(): # Вызывается 1 раз, т.к. 1 ключ #FIXME
            for item in v: # Обход списка вложенных контролов               
                for ik, _ in item.items(): # Вызывается 1 раз, для получения внутреннего ключа #FIXME
                    
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
            if item['class'].has_key(type_obj): # FIXME: Здесь нужно собирать все компоненты иерархически по item['class']
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
        for node in node_module.body:        
            if isinstance(node, ast.ClassDef) and node.name == class_name:                
                for nested_node in node.body:    
                    if isinstance(nested_node, ast.FunctionDef) and nested_node.name == Parser.GENERATED_FUNC:
                        return node, nested_node
                else:
                    raise Exception('Autogenerated function "%s" is not defined in class "%s"' % 
                                    (Parser.GENERATED_FUNC, class_name)    )      
        
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
        

def update_with_inheritance(m_list, parent=None, config=None):
    '''
    Обновляет маппинг объектов с учетом наследование, тоесть дозополняет
    свойствами объекты из унаследованных классов "parent"
    '''        
    
    for item in m_list:
        if parent and item.get('class').keys()[0] == parent:            
            config.update(item['config'])             
            break
        elif not parent and item.get('parent'):
            update_with_inheritance(m_list, item.get('parent'), item['config'])

# Для избавления от комментов делим файл на строки
raw_js = open(os.path.join(os.path.dirname(__file__), 'mapping.json'), 'r').readlines()

# Словарь сопоставлений контролов в дизайнере к контролам в питоне
mapping_list = json.loads('\n'.join(filter(lambda x: not '//' in x, raw_js)))

# Рекурсивное добавление свойств у классов наследников
update_with_inheritance(mapping_list)

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
    
def test_to_designer():
    js = Parser('tests.py', 'TestOne').to_designer()
    
    import pprint
    pprint.pprint( js ) 
    
    print 'Parser.to_designer - ok'
    
if __name__ == '__main__':
    test_from_designer()