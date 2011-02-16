#coding:utf-8
from django.db import models, connection
from django.db.models import Q
import datetime
import copy
from m3.contrib.palo_olap.server_api.server import PaloServer
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_NUMERIC
import threading
from m3.contrib.palo_olap.dimensions.base import BasePaloDimension

class ModelBasedPaloDimension(BasePaloDimension):
    '''
    дименшен который может обрабатывать на основании модели
    следит за изменениями в модели и хранить идишники пало
    обрабатывается либо полностью либо только изменений
    '''
    model = None #моедель на основании котороу бедм стороить дименшен
    unknow_name = u'Неизвестно' #задает имя элемента НЕИЗВЕСТО если задать None то создавать не будет
    need_unknow_element = False #нужно ли создавать элемент "Неизвестно"
    name_field = 'name' #поле в котором лежит имя или можно перекрыть функцию get_name которая будет возвращать имя в этом случае не забудь перекрыть функции get_not_unique_names
    check_unique_name = True #проверять уникальность имени (черещ процедуру get_not_unique_names
    sort_fields = [name_field] #порядок сортировки список полей которые передадауться а query.order-by

    _processed = False #обработано ли измерения (выгружены все свежие данные)
    _store_model = None #автогенерируемая модель для хранения доп атрибутов для элементов основно модели
    _consolidate_store_model = None #автогенерируемая модель для хранения консолидированных элементов модели
    _delete_lock = threading.Lock() #блокировка чтоб во время обработки никто не удалял измерение
    _change_lock = threading.Lock() #блокировка чтоб во время обработки никто не изменил измерение
    _not_unique_name = {}

    @classmethod
    def register(cls):
        '''
        зарегистрировать модель, делает такое:
        - создание динамических моделей на базе BaseStoreRelatedModel
        - подключение к сигналам post_save, post_delete целевой модели
        '''
        cls.create_store_model()
        cls.create_consolidate_store_model()
        cls.connect_signals()
 
        
    @classmethod
    def connect_signals(cls):
        models.signals.post_save.connect(cls.post_save_model, sender=cls.model)
        models.signals.pre_delete.connect(cls.pre_delete_model, sender=cls.model)
    
    @classmethod
    def get_store_related_name(cls):
        '''
        получить атрибут related_name для связанной модели
        '''
        res = cls.__name__ + 'Store'
        return res.lower()
    
    @classmethod
    def create_consolidate_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало для консолидированных элементов
        созданеи ведеться путем наследования от BaseConsolidateStoreModel 
        '''
        model_name = cls.__name__ + 'ConsolidateStore' 
        attrs = dict(__module__=cls.__module__)
        cls._consolidate_store_model = type(model_name, (BaseConsolidateStoreModel,), attrs)

    @classmethod
    def add_attr_to_store_model(cls, attrs):
        '''
        метод добавляет дополнительные атрибуты для генерируемой модели
        '''
        attrs['instance'] = models.OneToOneField(cls.model, null=True, related_name = cls.get_store_related_name())
        

    @classmethod
    def create_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало и информации о изменнии элементов целевой модели
        созданеи ведеться путем наследования от BaseStoreRelatedModel и добавление instance = ForeignKey
        '''
        model_name = cls.__name__ + 'Store' 
        attrs = dict()
        attrs['__module__'] =  cls.__module__
        cls.add_attr_to_store_model(attrs)
        cls._store_model = type(model_name, (BaseStoreRelatedModel,), attrs)

    @classmethod
    def post_save_model(cls, instance, **kwargs):
        '''
        обработка сигнала сохранения связанной модели
        '''
        cls._change_lock.acquire()
        try:
            q = cls._store_model.objects.filter(instance=instance)
            q.update(processed = False, last_action_time=datetime.datetime.now())
        finally:
            cls._change_lock.release()

    @classmethod
    def pre_delete_model(cls, instance, **kwargs):
        '''
        обработка сигнала удаления целевой модели
        '''
        cls._delete_lock.acquire()
        try:
            q = cls._store_model.objects.filter(instance=instance)
            q.update(processed = False, 
                     deleted = True, 
                     last_action_time=datetime.datetime.now(),
                     instance=None)
        finally:
            cls._delete_lock.release()

    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        super(ModelBasedPaloDimension, self).clear()
        self._store_model.objects.all().delete()
        self._consolidate_store_model.objects.all().delete()
        
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''

        super(ModelBasedPaloDimension, self).process(with_clear)
        
        if self.check_unique_name:
            self._not_unique_name = self.get_not_unique_names()
        result = dict()
        self.process_base_elements()
        result[u'Новых'] = self.process_new_items()
        result[u'Удаленных'] = self.process_deleted_items()
        result[u'Измененных'] = self.process_changed_items()
        self.after_process()
        
        return result

    def get_or_create_consolidate_element(self, name, type = ELEMENT_TYPE_CONSOLIDATED):
        try:
            return self._consolidate_store_model.objects.get(name=name).palo_id
        except self._consolidate_store_model.DoesNotExist:
            id = self._dim.create_element(name, type)
            st = self._consolidate_store_model()
            st.palo_id = id
            st.name = name
            st.save()
            return id
    def get_all_consolidate_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        assert self.need_all_consolidate_element
        assert self._all_id is not None
        return self._all_id

    def get_unknown_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        assert self._processed
        return self._unknown_id

    def process_base_elements(self):
        '''
        создает или находит основные консолидайт эелменты "ВСЕ", "НЕ УКАЗАН"
        '''
        if self.need_all_consolidate_element:
            self._all_id = self.get_or_create_consolidate_element(self.get_all_consolidate_element_name())
        if self.need_unknow_element:
            self._unknown_id = self.get_or_create_consolidate_element(self.unknow_name, ELEMENT_TYPE_NUMERIC)
    
    def get_name(self, obj):
        '''
        возвращает имя элемента или по фиелду или по функции
        '''
        name = getattr(obj,self.name_field)        
        if self._not_unique_name.has_key(name):
            name = self.regenerate_name(obj)
        return name
    
    def get_not_unique_names(self):
        '''
        возвращает список неуникальных имен
        '''
        query = self.get_model_query()
        query = query.values(self.name_field).annotate(cnt=models.Count(self.name_field))
        query = query.filter(cnt__gt=1)
        res = {}
        for o in query:
            res[o[self.name_field]] = o['cnt']
            
        #может так получиться что наше имя начинается с пробела или кончается им
        query = self.get_model_query()
        query = query.values(self.name_field).filter(Q(**{'%s__endswith'%self.name_field:' '}) | Q(**{'%s__startswith'%self.name_field:' '}))
        dop_res = {}
        for o in query:
            name = o[self.name_field] 
            if not dop_res.has_key(name):
                dop_res[name] = 1
            else:
                dop_res[name] = res[name] + 1
        #скопирум результаты тез кто больше двух
        for k,v in dop_res.items():
            if v<2:
                res[k] = v

        return res
    
    def regenerate_name(self, obj):
        '''
        регенерирует имя для элемента у которого имя оказалось в списке дублей
        '''
        return '%s (%i)' % (getattr(obj, self.name_field), obj.id)

    def get_model_query(self):
        '''
        возвращает квари элементв которого будут обрабатываться (загрузаться удаляться и прочее)
        '''
        q = self.model.objects.all()
        if self.sort_fields:
            q = q.order_by(*self.sort_fields)
        return q

    def get_palo_id(self, id_or_obj):
        '''
        ковертирует ид моделив в пало ид
        id_or_obj может быть либо идишником либо объектов
        '''
        if isinstance(id_or_obj, models.Model):
            #у нас в руках объект
            obj = id_or_obj
        else:
            #у нас в руках идишник
            obj = self.get_model_query().select_related(self.get_store_related_name()).get(pk=id_or_obj)
        st = getattr(obj, self.get_store_related_name())
        return st.palo_id

    def process_new_items(self):
        '''
        обработка новых элементов измерения (загрузка в palo server)
        '''
        self.__class__._delete_lock.acquire()
        try:
            #удалим все записи без кода пало
            st = self.get_store_related_name()
            query = self.get_model_query()
            query = query.select_related(st).filter(**{'%s__palo_id__isnull'%st:True})
            #query = query.exclude(pk__in=uses).order_by('pk')
            if query:
                names = [self.get_name(obj) for obj in query] 
                range_id = self._dim.create_elements(names)
                #запомним созданные идишники
                for i, obj in enumerate(query):
                    st = self._store_model()
                    st.instance = obj
                    st.processed = True
                    st.palo_id = range_id[i]
                    st.last_action_time = datetime.datetime.now()
                    st.save()
                    #отметим что надо пересчитать консидайшен эелементы
                        
                #ну вот всех добавили теперь обработаем добавление в косолидейшен элементы
                if self.need_all_consolidate_element:
                    self._dim.append_to_consolidate_element(self.get_all_consolidate_element_id(), range_id)
            return len(query)
        finally:
            self.__class__._delete_lock.release()

    def process_deleted_items(self):
        '''
        обработка удаленных элементов измерения (удаление из palo server)
        '''
        query = self._store_model.objects.filter(palo_id__isnull=False, deleted=True, last_action_time__lte=datetime.datetime.now())
        cnt = 0
        if query:
            for obj in query:
                self._dim.deleteElement(obj.palo_id)
                cnt += 1
            query.update(palo_id=None, processed=True)
        return cnt
        
    def process_changed_items(self):
        '''
        обработка измененных элементов измерения (удаление из palo server)
        '''
        start_proc_time = datetime.datetime.now()
        query = self.get_model_query()
        st = self.get_store_related_name()
        filter = {'%s__palo_id__isnull' % st :False,
                  '%s__processed' % st :False,
                  }
        query = query.select_related(st).filter(**filter)
        
        query = list(query)
        if query:
            for obj in query:
                palo_id = getattr(obj, st).palo_id
                self._dim.renameElement(palo_id, self.get_name(obj))
            #отметим что обработали    
            q = self._store_model.objects.filter(palo_id__isnull=False, processed=False, last_action_time__lte=start_proc_time)
            q.update(processed=True)
        return len(query)

class BaseStoreRelatedModel(models.Model):
    '''
    модель для хранения связанных атрибутов для элементов выбранной модели
    наследники модели генерируеться автоматически
    '''
#    instance = models.OneToOneField('self', null=True, related_name=...) #этот атрибут сгенерируеться автоматически
    palo_id = models.IntegerField(null=True)
    processed = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    last_action_time = models.DateTimeField(null=True)
    class Meta:
        abstract = True


class BaseConsolidateStoreModel(models.Model):
    '''
    модель для хранения консолидированнх элементов
    всегда имспользуется для хранения элементов ВСЕ, Не задан 
    '''
#    instance = models.ForeignKey('self') #этот атрибут сгенерируеться автоматически
    palo_id = models.IntegerField(null=True)
    name = models.CharField(max_length=250)
    class Meta:
        abstract = True
        
