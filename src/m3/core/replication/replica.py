# -*- coding: utf-8 -*-

from django.db import models
from django.utils.encoding import is_protected_type, smart_unicode
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import simplejson
from django.core import serializers
import datetime
import os
import zipfile
import tempfile

#========================== ИСКЛЮЧЕНИЯ =============================



#============================ ЛОГИКА ===============================

DEFAULT_REPLICA_FIELD = 'replica'
DEFAULT_CREATE_FIELD  = 'created'
DEFAULT_MODIFY_FIELD  = 'mod_time'
JSON_MODIFY_ATTRIBUTE = '__modify'

def get_filename_for_model(model_class):
    ''' Возвращает имя JSON файла для класса модели '''
    return model_class._meta.app_label + '.' + model_class._meta.module_name + '.json'

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
    
    def write_object(self, obj, is_related_object):
        '''
        Записывает объект в файл выгрузки
        @param obj: Объект потомок models.Model
        @param is_related_object: Флаг того что объект зависимый
        '''
        assert isinstance(obj, self._model_type)
        if obj.id in self._saved_objects:
            return []
        
        # Не забыть запятую
        if not self._first:
            self._file.write(',\n')
        self._first = False
        
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
        
        # Флаг того что объект зависимый и модифицированный
        if is_related_object is not None:
            self._fields[JSON_MODIFY_ATTRIBUTE] = int(is_related_object)
        
        self._file.write('"%s": ' % obj.id)
        # Напрямую писать нельзя! Связано с кодировкой консоли.
        ser_str = simplejson.dumps(self._fields, cls = DjangoJSONEncoder, indent = 4, ensure_ascii = False)
        self._file.write(ser_str.encode("utf-8"))
        self._saved_objects.append(obj.id)
        
        return related_objects
    
    def close(self):
        ''' Закрывает файл выгрузки '''
        self._file.write('}')
        self._file.close()

class WriteController(object):
    def __init__(self, export_file, managed_models, last_sync_time):
        self._zip_file = zipfile.ZipFile(export_file, 'w', zipfile.ZIP_DEFLATED)
        self._stream_pool = {}
        self._temp_dir = tempfile.mkdtemp()
        self._managed_models = managed_models
        self._last_sync_time = last_sync_time
        
    def _is_related_object(self, obj):
        ''' 
        Зависимым объект считается если он не указан явно в managed_models
        Возвращает None - не зависимый, False - зав. немодиф, True - зав. модиф
        '''
        if obj.__class__ in self._managed_models.keys():
            return
        if getattr(obj, DEFAULT_MODIFY_FIELD) >= self._last_sync_time:
            return True
        else:
            return False
        
    def write_object(self, obj):
        '''
        Записывает объект в один из файлов выгрузки, соответствующий приложению и имени модели.
        @param obj: Объект потомок models.Model
        '''
        model_type = obj.__class__
        # Получаем файловый поток для класса модели
        if not self._stream_pool.has_key(model_type):
            filename = get_filename_for_model(obj)
            filename = os.path.join(self._temp_dir, filename)
            stream = SerializationStream(filename, model_type)
            self._stream_pool[model_type] = stream
        else:
            stream = self._stream_pool[model_type]
            
        related_objects = stream.write_object(obj, self._is_related_object(obj))
        for rel_obj in related_objects:
            self.write_object(rel_obj)
    
    def pack(self):
        ''' Запаковывает файлы выгрузки в zip архив '''
        for stream in self._stream_pool.values():
            stream.close()
            self._zip_file.write(stream.filename, os.path.basename(stream.filename))
            os.remove(stream.filename)
        
class ReadController(object):
    def __init__(self, import_file):
        # Распаковываем во временную папку
        self.temp_dir = tempfile.mkdtemp()
        self.arch = zipfile.ZipFile(import_file)
        self.arch.extractall(self.temp_dir)
        #
        self._objects_pool = {}
        self._imported_objects = {}
        
    def close(self):
        # Удаляем мусор после себя
        for filename in self.arch.namelist():
            os.remove(os.path.join(self.temp_dir, filename))
    
    def get_stream_for_type(self, type):
        model_class = type
        #if isinstance(type, str):
        #    model_class = models.get_model()
        
        if self._objects_pool.has_key(model_class):
            return self._objects_pool[model_class]
        else:
            filename = get_filename_for_model(model_class)
            file = open(os.path.join(self.temp_dir, filename), "r")
            objects = simplejson.load(file)
            file.close()
            self._objects_pool[model_class] = objects
            return objects
            
    
    def get_fields_for_object(self, type, pk):
        ''' Возвращает словарь с полями объекта извлеченные по типу и первичному ключу '''
        return self.get_stream_for_type(type)[str(pk)]
    
    def import_object(self, model_type, obj_dict, options):
        '''
        
        '''
        model = model_type;
        # Проверяем, был ли этот объект уже импортирован?
        #cache = self._imported_objects.get(model_type, None)
        #if cache is not None:
            
        
        # Определяем есть в базе уже модель такого типа с таким же кодом репликации
        # если да, то используем ее для перезаписи, иначе создаем новую
        repl_code_field = options[0]
        import_repl_code = obj_dict[repl_code_field]
        kwargs = {repl_code_field: import_repl_code}
        already_exist = False
        try:
            out_obj = model.objects.get(**kwargs)
            already_exist = True
        except:
            out_obj = model() 
        
        # Если объект уже существует в базе
        if already_exist:
            related_flag = obj_dict.get(JSON_MODIFY_ATTRIBUTE, -1)
            # И объект зависимый, то переписывать его можно только если он модифицирован
            if related_flag == 0:
                return out_obj
        
        # Простые поля заполняем исходя из значений. Для ссылочных полей сначала загружаем зависимые объекты
        mod_time_name = options[1]
        for field in out_obj._meta.local_fields:
            if field.serialize:
                field_name = field.name
                # Поле со штампом модификации не изменяем
                if field_name == mod_time_name:
                    continue
                if field.rel is None:
                    # Можно просто присвоить
                    value = field.to_python(obj_dict[field_name])
                    setattr(out_obj, field_name, value)
                else:
                    # Нужно присвоить соответствующий экземпляр
                    related_type = field.rel.to
                    related_obj_dict = self.get_fields_for_object(related_type, obj_dict[field_name])
                    value = self.import_object(related_type, related_obj_dict, options)
                    setattr(out_obj, field_name, value)
                    
        out_obj.save()
        
        # Много-ко-многим идут сами по себе + нужно чтобы объект был сохранен
        have_m2m = False
        for field in out_obj._meta.many_to_many:
            if field.serialize:
                field_name = field.name
                related_type = field.rel.to
                # Сериализованное M2M значение представляет собой список первичных ключей,
                # но т.к. мы оперируем ключами чужой базы в нашей они будут другими
                # По ходу обработки зависимых объектов будем присваивать новые ключи
                new_pkeys = []
                for pk in field.to_python(obj_dict[field_name]):
                    related_obj_dict = self.get_fields_for_object(related_type, pk)
                    value = self.import_object(related_type, related_obj_dict, options)
                    new_pkeys.append(value)
                setattr(out_obj, field_name, new_pkeys)
                have_m2m = True
        # Записываем опять
        if have_m2m:
            out_obj.save()
        
        return out_obj
    

class BaseReplication(object):
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
        
        rc = ReadController(import_filename)
        
        # 
        for model_type, options in self.managed_models.items():
            items = rc.get_stream_for_type(model_type)
            for dict_object in items.values():
                rc.import_object(model_type, dict_object, options)
        
        rc.close()
        
        
    def do_export(self, export_filename, last_sync_time):
        '''
        Выгружает объекты указанные в словаре managed_models с условием что их время модификации >= last_sync_time
        Тянет с собой все зависимые объекты. Каждый зависимый объект помечается флагом модифицированности.
        Каждому классу модели соответствует свой JSON файл, которые потом запаковываются в ZIP архив.
        @param export_filename:
        @param last_sync_time:
        '''
        assert len(self.managed_models) > 0, u"Ни одна модель не указана в managed_models"
        assert isinstance(last_sync_time, datetime.datetime), u"last_sync_time должен быть типа datetime"
        
        writer = WriteController(export_filename, self.managed_models, last_sync_time)
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

