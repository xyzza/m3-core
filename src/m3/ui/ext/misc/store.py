#coding:utf-8
'''
Created on 3.3.2010

@author: prefer
'''

from base import BaseExtStore

class ExtDataStore(BaseExtStore):
    def __init__(self, *args, **kwargs):
        super(ExtDataStore, self).__init__(*args, **kwargs)
        self.data = args[0] # По умолчанию первым параметром передаются данные на заполнение store
        self.init_component(*args, **kwargs)
        
    def load_data(self, data):
        self.data = data
        
    def render(self, columns):
        sections = []
        for record in self.data:
            values = []
            for value in record:
                values.append(value) 

            sections.append("['%s']" % "','".join(values))
        return '[%s]' % ','.join(sections)
    
class ExtJsonStore(BaseExtStore):
    def __init__(self, *args, **kwargs):
        super(ExtJsonStore, self).__init__(*args, **kwargs)
        self.url = ''
        self.auto_load = False
        self.init_component(*args, **kwargs)
        
    def render(self, columns):
        js = 'id: "%s"' % self.client_id
        js += '' if not self.url else ',url: "%s"' % self.url
        js += '' if not self.auto_load else ',autoLoad: "%s"' % str(self.auto_load).lower()
        js += ',fields:[%s]' % ','.join(['{name: "%s", mapping: "%s"}' % (column.data_index , column.data_index) for column in columns])       
        return 'new Ext.data.JsonStore({%s})' % js
        
        
        