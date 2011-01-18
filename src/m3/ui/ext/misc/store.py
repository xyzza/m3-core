#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''
from m3.helpers import normalize

from m3.ui.ext.base import BaseExtComponent
from base_store import BaseExtStore
from django.utils.html import escape

class ExtDataStore(BaseExtStore):
    def __init__(self, data = None, *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)
        if data:
            # По умолчанию первым параметром передаются данные на заполнение store
            self.data = data 
        else:
            self.data = []
            
        self.template = 'ext-misc/ext-data-store.js'
        self.__columns = [] # Для заполнения полей в шаблоне
        self.init_component(*args, **kwargs)
        
    def load_data(self, data):
        self.data = data
        
    def render(self, columns):
        self.__columns = columns
        self.__columns.insert(0, 'id') # Для того, чтобы submit работал корректно
        return super(ExtDataStore, self).render()
    
    def t_render_fields(self):
        '''Прописывается в шаблоне и заполняется при рендеринге'''
        return ','.join(['{name: "%s", mapping: %d}' % (data_index, i) for i, data_index in enumerate(self.__columns)])
    
    def t_render_data(self):
        '''Прописывается в шаблоне и заполняется при рендеринге'''
        res = []
        for item in self.data:    
            res_tmp = []
            for subitem in item:
                if isinstance(subitem, bool):
                    res_tmp.append( str(subitem).lower() )
                elif isinstance(subitem, int):
                    res_tmp.append( str(subitem) )
                else:
                    res_tmp.append('"%s"' % escape(subitem) )
                    
            res.append( '[%s]' % ','.join(res_tmp) )
        return ','.join(res)
            
    
class ExtJsonStore(BaseExtStore):
    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-json-store.js'
        self.__columns = [] # Для заполнения полей в шаблоне
        self.__start = 0
        self.__limit = -1
        self.total_property = None
        self.root = None
        self.remote_sort = False
        self.id_property = 'id'
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        self.__columns = columns
        self.__columns.insert(0, self.id_property)
        return super(ExtJsonStore, self).render()
        
    def t_render_fields(self):
        '''
            Прописывается в шаблоне и заполняется при рендеринге
        '''
        return ','.join(['{name: "%s"}' % data_index for data_index in self.__columns]) 
    
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


class ExtJsonWriter(BaseExtStore):
    '''
    Предназначен для отправки и преобразования новых и измененных записей Store на сервер
    '''
    def __init__(self, *args, **kwargs):
        super(ExtJsonWriter, self).__init__(*args, **kwargs)
        self.encode = True
        self.encode_delete = False
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

class ExtJsonReader(BaseExtComponent):
    '''
    Ридер для данных
    '''
    def __init__(self, *args, **kwargs):
        super(ExtJsonReader, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-json-reader.js'
        self.id_property = 'id'
        self.root = None
        self.total_property = None
        self.__fields = []
        self.init_component(*args, **kwargs)
        
    def t_render_fields(self): 
        return ','.join(['{name: "%s"}' % field for field in self.__fields])
    
    def set_fields(self, *args):
        for field in args:
            self.__fields.append(field)
            
    def get_fields(self):
        return self.__fields         

class ExtGroupingStore(ExtJsonStore):
    '''
    Хранилище используемое для группировки по определенным полям в гриде
    '''     
    def __init__(self, *args, **kwargs):
        super(ExtGroupingStore, self).__init__(*args, **kwargs)
        self.template = 'ext-misc/ext-grouping-store.js'
        self.remote_group = False
        self.group_field = None
        self.sort_info = None
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        assert self.sort_info in self.reader.get_fields(), \
        'can`t find sortfield "%s" in %s' % (self.sort_info,self.reader.get_fields(),)
        assert self.group_field in self.reader.get_fields(), \
        'can`t find groupfield "%s" in %s' % (self.group_field,self.reader.get_fields(),)
        return super(ExtGroupingStore, self).render(columns)        