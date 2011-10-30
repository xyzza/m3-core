#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
import json
from decimal import Decimal

from m3.helpers import normalize

from m3.ui.ext.base import BaseExtComponent

from base_store import BaseExtStore


#===============================================================================
class ExtDataStore(BaseExtStore):
    '''
    Хранилище данных, которое не генерирует запрос на сервер, а принимает данные
    в массиве data, либо через метод load_data
    '''
    def __init__(self, data = None, *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)
        
        # По умолчанию первым параметром передаются данные на заполнение store
        if data:            
            self.data = data 
        else:
            self.data = []
            
        self.id_property = 'id'
        
        self.template = 'ext-misc/ext-data-store.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Для заполнения полей в шаблоне
        self.__columns = [] 
        self.init_component(*args, **kwargs)
        
    def load_data(self, data):
        self.data = data
        
    def render(self, columns):
        self.__columns = columns
        #self.__columns.insert(0, 'id') # Для того, чтобы submit работал корректно
        return super(ExtDataStore, self).render()
    
    def t_render_fields(self):
        '''Прописывается в шаблоне и заполняется при рендеринге'''
        res = ['{name: "%s", mapping: %d}' % (self.id_property, 0)] # ID
        # чтобы правильно выставить mapping надо определить, есть ли в списке колонок поле с таким же именем
        # если такая колонка встречается, то пропускаем её
        ind = 1
        for i, col in enumerate(self.__columns):
            if isinstance(col, basestring):
                if col != self.id_property:
                    res.append('{name: "%s", mapping: %d}' % (col, ind+i))
                else:
                    ind = 0
            else:
                if col.data_index != self.id_property:
                    d = {'name': col.data_index, 'mapping': ind+i} # 1-ое поле - ID
                    if hasattr(col, 'format'): # ExtDateField
                        d['type'] = 'date'
                        d['dateFormat'] = col.format
                    res.append(json.dumps(d))
                else:
                    ind = 0
        return ','.join(res) 
    
    def t_render_data(self):
        '''Прописывается в шаблоне и заполняется при рендеринге'''
        res = []
        for item in self.data:    
            res_tmp = []
            for subitem in item:
                if isinstance(subitem, bool):
                    res_tmp.append( str(subitem).lower() )
                elif isinstance(subitem, int) or isinstance(subitem, Decimal) \
                    or isinstance(subitem, float):
                    res_tmp.append( str(subitem) )
                else:
                    res_tmp.append('"%s"' % normalize(subitem) )
                    
            res.append( '[%s]' % ','.join(res_tmp) )
        return ','.join(res)
            
#===============================================================================    
class ExtJsonStore(BaseExtStore):
    '''
    Хранилище данных, которое отправляет запрос на сервер и ждет, что данные 
    вернуться в формате json
    '''
    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-json-store.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Для заполнения полей в шаблоне
        self.__columns = [] 
        
        # Начальная позиция для показа, если используется постраничная навигация
        self.__start = 0
        
        # Количество записей для показа, если используется постраничная навигация
        self.__limit = -1
        
        # 
        self.total_property = None
        
        # Название вершины в json массиве, откуда будут браться записи
        # Например root = 'rows'
        # Тогда предполагаемый json массив должен выглядеть примерно так:
        # {rows: [id:1, name:'name', age:45]}
        self.root = None
        
        # Использовать ли удаленную сортировку
        self.remote_sort = False
        
        # Поле, откуда будет браться id записи
        self.id_property = 'id'
        
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        self.__columns = columns
        #self.__columns.insert(0, self.id_property)
        return super(ExtJsonStore, self).render()
        
    def t_render_fields(self):
        '''
        Прописывается в шаблоне и заполняется при рендеринге
        '''

        res = ['{name: "%s"}' % self.id_property]
        for col in self.__columns:
            if isinstance(col, basestring):
                if col != self.id_property:
                    res.append('{name: "%s"}' % col)
            else:
                if col.data_index != self.id_property:
                    d = {'name': col.data_index}
                    if hasattr(col, 'format'): # ExtDateField                
                        d['type'] = 'date'
                        d['dateFormat'] = col.format

                    res.append(json.dumps(d))
        return ','.join(res) 
    
    def _get_start(self):
        return self.__start
    
    def _set_start(self, s):
        self.__start = s
        self._base_params['start'] = self.__start
    
    start = property(_get_start, _set_start)
    
    def _get_limit(self):
        return self.__limit
    
    def _set_limit(self, l):
        self.__limit = l
        self._base_params['limit'] = self.__limit
    
    limit = property(_get_limit, _set_limit)

#===============================================================================
class ExtJsonWriter(BaseExtStore):
    '''
    Предназначен для отправки и преобразования новых и измененных записей Store на сервер
    '''
    def __init__(self, *args, **kwargs):
        super(ExtJsonWriter, self).__init__(*args, **kwargs)
        
        # Если True, записи (records) переводится в хешированные данные, имя беруться из
        # ридера (Reader). Подробности http://extjs.docs/d/?class=Ext.data.JsonWriter
        self.encode = True
        
        # Если False, при удалении будет отправляться только id записи на сервер
        self.encode_delete = False
        
        # Если True, то сохраняются все записи, а не только измененные
        self.write_all_fields = False
        
        self.init_component(*args, **kwargs)
    
    def render(self):
        result = '''
new Ext.data.JsonWriter({
    %(writeAllFields)s
    %(encode)s
    %(encodeDelete)s
})        
        ''' % {'writeAllFields': 'writeAllFields: true' if self.write_all_fields else '',
               'encode': 'encode: false' if not self.encode else '',
               'encodeDelete': 'encodeDelete: true' if self.encode_delete else ''}
        
        return result

#===============================================================================
class ExtJsonReader(BaseExtComponent):
    '''
    Ридер для данных
    '''
    def __init__(self, *args, **kwargs):
        super(ExtJsonReader, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-json-reader.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Поле, откуда будет браться идентификатор
        self.id_property = 'id'
        
        # Название вершины в json массиве, откуда будут браться записи
        # Например root = 'rows'
        # Тогда предполагаемый json массив должен выглядеть примерно так:
        # {rows: [id:1, name:'name', age:45]}
        self.root = None
        
        #
        self.total_property = None
        
        # Массив данных
        self.__fields = []
        
        self.init_component(*args, **kwargs)
        
    def t_render_fields(self): 
        return ','.join(['{name: "%s"}' % field for field in self.__fields])
    
    def set_fields(self, *args):
        for field in args:
            self.__fields.append(field)
            
    def get_fields(self):
        return self.__fields         

#===============================================================================
class ExtGroupingStore(ExtJsonStore):
    '''
    Хранилище используемое для группировки по определенным полям в гриде
    '''     
    def __init__(self, *args, **kwargs):
        super(ExtGroupingStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-grouping-store.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        
        # Серверная группировка
        self.remote_group = False
        
        # Имя поля, используемой для сортировки
        self.group_field = None
        
        # Объект, в котором может указываться например порядок сортировки
        # см: http://extjs.docs/d/?class=Ext.data.GroupingStore
        self.sort_info = None
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        assert self.sort_info in self.reader.get_fields(), \
        'can`t find sortfield "%s" in %s' % (self.sort_info,self.reader.get_fields(),)
        assert self.group_field in self.reader.get_fields(), \
        'can`t find groupfield "%s" in %s' % (self.group_field,self.reader.get_fields(),)
        return super(ExtGroupingStore, self).render(columns)
    
#===============================================================================
class ExtMultiGroupingStore(ExtJsonStore):
    '''
    Хранилище используемое для грида с множественной серверной группировкой
    '''     
    def __init__(self, *args, **kwargs):
        super(ExtMultiGroupingStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-livegrid-store.js' # TODO: Отрефакторить под внутриклассовый рендеринг
        self.version_property = 'version'
        self.bufferSize = 200
        self.init_component(*args, **kwargs)
