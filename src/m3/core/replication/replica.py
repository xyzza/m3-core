# -*- coding: utf-8 -*-

from django.db import models
from django.utils.encoding import is_protected_type, smart_unicode
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import simplejson
import datetime
import os
import zipfile
import tempfile

#========================== ИСКЛЮЧЕНИЯ =============================



#============================ ЛОГИКА ===============================

class SerializationStream(object):
    def __init__(self, filename, model_type):
        self._model_type = model_type
        self._saved_objects = []
        self._first = True
        self.filename = filename
        self._file = open(filename, "w")
        self._file.write('{')
    
    def _handle_field(self, obj, field):
        ''' Возвращает значение поля объекта в джанговской постобработке '''
        value = field._get_val_from_obj(obj)
        # Protected types (i.e., primitives like None, numbers, dates,
        # and Decimals) are passed through as is. All other values are
        # converted to string first.
        if is_protected_type(value):
            self._fields[field.name] = value
        else:
            self._fields[field.name] = field.value_to_string(obj)
    
    def _handle_m2m_field(self, obj, field, related_objects):
        ''' Возвращает список ID зависимых M2M объектов '''
        if field.creates_table:
            rel = []
            for related in getattr(obj, field.name).iterator():
                related_objects.append(related)
                obj = smart_unicode(related._get_pk_val(), strings_only = True)
                rel.append(obj)
            self._fields[field.name] = rel
    
    def _handle_fk_field(self, obj, field, related_objects):
        '''
        Возвразает ID зависимого объекта. Причем зависимость допускается только по первичному ключу.
        ''' 
        related = getattr(obj, field.name)
        related_objects.append(related)
        if related is not None:
            if field.rel.field_name == related._meta.pk.name:
                # Related to remote object via primary key
                related = related._get_pk_val()
            else:
                # Related to remote object via other field
                related = getattr(related, field.rel.field_name)
        self._fields[field.name] = smart_unicode(related, strings_only=True)
    
    def write_object(self, obj):
        '''
        Записывает объект в файл выгрузки
        @param obj: Объект потомок models.Model
        '''
        assert isinstance(obj, self._model_type)
        if obj.id in self._saved_objects:
            return []
        
        # Не забыть запятую
        if not self._first:
            self._file.write(',\n')
        
        # Переводим сериализуемые поля объекта в словарь
        self._fields = {}
        related_objects = []
        for field in obj._meta.local_fields:
            if field.serialize:
                if field.rel is None:
                    self._handle_field(obj, field)
                else:
                    self._handle_fk_field(obj, field, related_objects)
        for field in obj._meta.many_to_many:
            if field.serialize:
                    self._handle_m2m_field(obj, field, related_objects)
        
        self._file.write('"%s": ' % obj.id)
        simplejson.dump(self._fields, self._file, cls = DjangoJSONEncoder, indent = 4)    
        self._saved_objects.append(obj.id)
        
        return related_objects
    
    def close(self):
        ''' Закрывает файл выгрузки '''
        self._file.write('}')
        self._file.close()

class WriteController:
    def __init__(self, import_file):
        self._zip_file = zipfile.ZipFile(import_file, 'w', zipfile.ZIP_DEFLATED)
        self._stream_pool = {}
        self._temp_dir = tempfile.mkdtemp()
        
    def write_object(self, obj):
        '''
        
        @param obj:
        '''
        model_type = obj.__class__
        # Получаем файловый поток для класса модели
        if not self._stream_pool.has_key(model_type):
            filename = os.path.join(self._temp_dir, model_type.__name__ + '.json')
            stream = SerializationStream(filename, model_type)
            self._stream_pool[model_type] = stream
        else:
            stream = self._stream_pool[model_type]
            
        related_objects = stream.write_object(obj)
        for rel_obj in related_objects:
            self.write_object(rel_obj)
            
    def pack(self):        
        # Закрываем открытые файлы
        for stream in self._stream_pool.values():
            stream.close()
            self._zip_file.write(stream.filename, os.path.basename(stream.filename))
            os.remove(stream.filename)
        

class BaseReplication:
    '''
    Базовый класс для импорта и экспорта файлов репликаций.
    
    '''
    managed_models = {}
    
    def do_import(self, import_filename):
        '''
        Распаковываем содержимое в файла
        Для каждой записи:
            Если уже есть с таким же кодом репликации - перезаписываем, 
            иначе создаем новую запись
        '''
        pass
    
        
    def do_export(self, export_filename, last_sync_time):
        '''  '''
        assert len(self.managed_models) > 0, u"Ни одна модель не указана в managed_models"
        assert isinstance(last_sync_time, datetime.datetime), u"last_sync_time должен быть типа datetime"
        
        writer = WriteController(export_filename)
        kwargs = {}
        # Проходим все указанные модели
        for model_type, options in self.managed_models.items():
            assert issubclass(model_type, models.Model)
            assert isinstance(options, list)
            # Выбираем подходящие объекты
            ts_name = options[1] + '__gte'
            kwargs[ts_name] = last_sync_time
            objects = model_type.objects.filter(**kwargs)
            # Пишем объекты
            for obj in objects:
                writer.write_object(obj)
            
        writer.pack()        

