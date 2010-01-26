# -*- coding: utf-8 -*-

from django.db import models, transaction
from django.utils.encoding import is_protected_type, smart_unicode
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import simplejson
from django.conf import settings
import tarfile
import datetime
import os
import tempfile

__all__ = ['BaseReplication', 'ExportResult', 'ImportResult']

#============================ КОНСТАНТЫ ===============================

DEFAULT_REPLICA_FIELD = 'replica'
DEFAULT_CREATE_FIELD  = 'created'
DEFAULT_MODIFY_FIELD  = 'mod_time'
JSON_MODIFY_ATTRIBUTE = '__modify'

#======================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================

def get_filename_for_model(model_class):
    ''' Возвращает имя JSON файла для класса модели '''
    return model_class._meta.app_label + '.' + model_class._meta.module_name + '.json'

#=========================== ЭКСПОРТ ==================================

class SerializationStream(object):
    def __init__(self, filename, model_type):
        '''
        @param filename: Имя файла в который будут писаться объекты
        @param model_type: Класс модели объектов
        '''
        self._model_type = model_type
        self._saved_objects = set()
        self._first = True
        self.result = ExportResult()
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
        if related is not None:
            related_objects.append(related)
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
        indent = 4
        if not settings.DEBUG:
            indent = None
        ser_str = simplejson.dumps(self._fields, cls = DjangoJSONEncoder, indent = indent, ensure_ascii = False)
        self._file.write(ser_str.encode("utf-8"))
        
        self.result.add(is_related_object)
        self._saved_objects.add(obj.id)
        return related_objects
    
    def close(self):
        ''' Закрывает файл выгрузки '''
        self._file.write('}')
        self._file.close()


class ExportController(object):
    def __init__(self, export_file, managed_models, last_sync_time):
        self._archive = tarfile.open(export_file, 'w:bz2')
        self._temp_dir = tempfile.mkdtemp()
        self._stream_pool = {}
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
        ''' Запаковывает файлы выгрузки в tar.bz2 архив и удаляет мусор из временной папки '''
        for stream in self._stream_pool.values():
            stream.close()
            self._archive.add(stream.filename, os.path.basename(stream.filename))
            os.remove(stream.filename)
        self._archive.close()
        os.removedirs(self._temp_dir)
                
    def get_result(self):
        ''' Возвращает список объектов которые должны были попасть в выгрузку '''
        result = ExportResult()
        for stream in self._stream_pool.values():
            result += stream.result
        return result


class ExportResult(object):
    ''' Класс содержит результаты экспорта объектов из БД '''
    def __init__(self):
        # Количество объектов описанных в классе реплики и отобранных по условию >= last_sync_time
        self.changed = 0
        # Количество зависимых и измененных экспортируемых объектов
        self.related = 0
        # Количество зависимых и неизмененных экспортируемых объектов 
        self.referenced = 0
        
    def add(self, is_related_object):
        if is_related_object == None:
            self.changed += 1
        elif is_related_object == True:
            self.related += 1
        elif is_related_object == False:
            self.referenced += 1
            
    def __add__(a, b):
        result = ExportResult()
        result.changed = a.changed + b.changed
        result.related = a.related + b.related
        result.referenced = a.referenced + b.referenced
        return result
        
#============================= ИМПОРТ ============================

class ImportResult(object):
    ''' Класс содержит результаты импорта объетов в БД '''
    def __init__(self):
        # Созданные заного объекты
        self.created = 0
        # Перезаписанные объекты
        self.modifyed = 0
    
    def add(self, already_exists):
        if already_exists:
            self.modifyed += 1
        else:
            self.created += 1

class ImportController(object):
    def __init__(self, import_file, managed_models):
        # Распаковываем во временную папку
        self._temp_dir = tempfile.mkdtemp()
        self._archive = tarfile.open(import_file, 'r:bz2')
        self._archive.extractall(self._temp_dir)
        #
        self._objects_pool = {}
        self._imported_objects_cache = {}
        self.managed_models = managed_models
        self.result = ImportResult()
        
    def close(self):
        # Удаляем мусор после себя
        for member in self._archive.getmembers():
            os.remove(os.path.join(self._temp_dir, member.name))
        os.removedirs(self._temp_dir)
    
    def get_stream_for_type(self, model_type):
        ''' Возвращает десериализованное содержимое файла для заданного класса модели '''    
        if self._objects_pool.has_key(model_type):
            return self._objects_pool[model_type]
        else:
            filename = get_filename_for_model(model_type)
            file = open(os.path.join(self._temp_dir, filename), "r")
            objects = simplejson.load(file)
            file.close()
            self._objects_pool[model_type] = objects
            return objects
            
    
    def get_fields_for_object(self, type, pk):
        ''' Возвращает словарь с полями объекта извлеченные по типу и первичному ключу '''
        return self.get_stream_for_type(type)[str(pk)]
    
    def get_replica_field_name(self, model_type):
        ''' Возвращает код репликации для модели. Для зависимых моделей он не задан явно и берется из константы '''
        options = self.managed_models.get(model_type, None)
        if options == None:
            return DEFAULT_REPLICA_FIELD
        else:
            return options[0]
    
    def get_mod_time_field_name(self, model_type):
        ''' Возвращает имя поля последней модификации для заданного класса модели '''
        options = self.managed_models.get(model_type, None)
        if options == None:
            return DEFAULT_MODIFY_FIELD
        else:
            return options[1]
    
    def import_object(self, model_type, obj_pk):
        '''
        При необходимости импортирует объект в текущую БД.
        Возвращает импортированный объект или уже существующий объект
        @param model_type: Класс модели объекта
        @param obj_pk: Первичный ключ импортируемого объекта
        '''
        # Проверяем, был ли этот объект уже импортирован? Тогда достаем из кеша. 
        cached_pkeys = self._imported_objects_cache.get(model_type, None)
        if cached_pkeys is not None:
            cached_obj = cached_pkeys.get(str(obj_pk), None)
            if cached_obj is not None:
                return cached_obj
        else:
            self._imported_objects_cache[model_type] = {}
        
        obj_fields = self.get_fields_for_object(model_type, obj_pk)        
        repl_code_field = self.get_replica_field_name(model_type)
        
        # Определяем есть в базе уже модель такого типа с таким же кодом репликации
        # если да, то используем ее для перезаписи, иначе создаем новую
        import_repl_code = obj_fields[repl_code_field]
        kwargs = {repl_code_field: import_repl_code}
        already_exist = False
        model = model_type;
        try:
            out_obj = model.objects.get(**kwargs)
            already_exist = True
        except:
            out_obj = model() 
        
        # Если объект уже существует в базе
        if already_exist:
            related_flag = obj_fields.get(JSON_MODIFY_ATTRIBUTE, -1)
            # И объект зависимый, то переписывать его можно только если он модифицирован
            if related_flag == 0:
                return out_obj
        
        # Простые поля заполняем исходя из значений. Для ссылочных полей сначала загружаем зависимые объекты
        mod_time_name = self.get_mod_time_field_name(model_type)
        for field in out_obj._meta.local_fields:
            if field.serialize:
                field_name = field.name
                # Поле со штампом модификации не изменяем
                if field_name == mod_time_name:
                    continue
                if field.rel is None:
                    # Можно просто присвоить
                    value = field.to_python(obj_fields[field_name])
                    setattr(out_obj, field_name, value)
                else:
                    # Нужно присвоить соответствующий экземпляр
                    related_type = field.rel.to
                    pk = obj_fields[field_name]
                    if pk == None:
                        value = None
                    else:
                        value = self.import_object(related_type, pk)
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
                for pk in field.to_python(obj_fields[field_name]):
                    value = self.import_object(related_type, pk)
                    new_pkeys.append(value)
                setattr(out_obj, field_name, new_pkeys)
                have_m2m = True
        
        if have_m2m:
            out_obj.save()
        
        # Добавляем результат в кэш
        self._imported_objects_cache[model_type][str(obj_pk)] = out_obj
        self.result.add(already_exist)
        
        return out_obj


class BaseReplication(object):
    ''' Базовый класс для импорта и экспорта файлов репликаций. '''
    managed_models = {}
    
    @transaction.commit_on_success
    def do_import(self, import_filename):
        '''
        Импортирует объекты из файла экспорта в БД.
        @param import_filename: Имя архива TAR.BZ2
        '''
        rc = ImportController(import_filename, self.managed_models)
        # 
        for model_type in self.managed_models.keys():
            items = rc.get_stream_for_type(model_type)
            for pk in items.keys():
                rc.import_object(model_type, pk)
        
        rc.close()
        return rc.result
    
    def get_objects_for_export(self, model_type, last_sync_time, options, *args, **kwargs):
        '''
        Возвращает список объектов для экспорта. Может быть перекрыта в потомках. 
        '''
        assert issubclass(model_type, models.Model), u"Экспортируемый объект должен быть моделью Django"
        assert isinstance(last_sync_time, datetime.datetime), u"last_sync_time должен быть типа datetime"
        assert isinstance(options, list)
        
        # Выбираем подходящие объекты
        ts_name = options[1] + '__gte'
        filter = {}
        filter[ts_name] = last_sync_time
        objects = model_type.objects.filter(**filter)

        return objects
    
    def do_export(self, export_filename, last_sync_time, *args, **kwargs):
        '''
        Выгружает объекты указанные в словаре managed_models с условием что их время модификации >= last_sync_time
        Тянет с собой все зависимые объекты. Каждый зависимый объект помечается флагом модифицированности.
        Каждому классу модели соответствует свой JSON файл, которые потом запаковываются в TAR.BZ2 архив.
        @param export_filename: Имя архива
        @param last_sync_time: Время последней модификации
        '''
        assert len(self.managed_models) > 0, u"Ни одна модель не указана в managed_models"
        
        writer = ExportController(export_filename, self.managed_models, last_sync_time)
        # Проходим все указанные модели
        for model_type, options in self.managed_models.items():
            objects = self.get_objects_for_export(model_type, last_sync_time, options, *args, **kwargs)
            for obj in objects:
                writer.write_object(obj)

        writer.pack()
        return writer.get_result()

