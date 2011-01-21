#coding:utf-8
from django.db import models, connection
import datetime
import copy
from m3.contrib.palo_olap.server_api.server import PaloServer
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED
import threading

class BaseModelBassedPaloDimension(object):
    '''
    класс для описания дименшена на основании модели
    '''
    model = None #моедель на основании котороу бедм стороить дименшен
    name = None #имя дименшена (должно быть уникодовым)
    all_name = u'Все' #имя для консолидированного элемента (все элементы)
    name_field = 'name' #поле в котором лежит имя или можно перекрыть функцию get_name которая будет возвращать имя в этом случае не забудь перекрыть функции get_not_unique_names
    check_unique_name = True #проверять уникальность имени (черещ процедуру get_not_unique_names
    make_tree = False #надо ли создавать древовидную структуру (если до то надо определить get_parent(obj), get_childrens(obj) если модель не mptt 

    _store_model = None #автогенерируемая модель для хранения доп атрибутов для элементов основно модели
    _consolidate_store_model = None #автогенерируемая модель для хранения консолидированных элементов модели
    _delete_lock = threading.Lock() #блокировка чтоб во время обработки никто не удалял измерение
    _change_lock = threading.Lock() #блокировка чтоб во время обработки никто не изменил измерение
    _dim = None #PaloDimension with connect
    _not_unique_name = {}
    
    def __init__(self, server_host, user, password, db_name):
        self._server_host = server_host
        self._user = user
        self._password = password
        self._db_name = db_name
        self._dim = self.get_palo_dim()

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
    def create_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало и информации о изменнии элементов целевой модели
        созданеи ведеться путем наследования от BaseStoreRelatedModel и добавление instance = ForeignKey
        '''
        model_name = cls.__name__ + '_store' 
        attrs = dict()
        attrs['__module__'] =  cls.__module__
        attrs['instance'] = models.ForeignKey(cls.model, null=True)
        if cls.make_tree:
            #для древовидной структыры нам надо помнить родителя т.к. если эелмент переносят в другую ветку то из какой перенесли мы узнаем отсюда
            attrs['instance_parent'] = models.ForeignKey(cls.model, null=True, related_name='instance_parent')  
        cls._store_model = type(model_name, (BaseStoreRelatedModel,), attrs)
        
    @classmethod
    def create_consolidate_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало для консолидированных элементов
        созданеи ведеться путем наследования от BaseConsolidateStoreModel 
        '''
        model_name = cls.__name__ + '_consolidate_store' 
        attrs = dict(__module__=cls.__module__)
        cls._consolidate_store_model = type(model_name, (BaseConsolidateStoreModel,), attrs)
        
    def get_parent(self, obj):
        '''
        возвращает ид родителя (ид модели)
        если make_tree стоит то реальный родитель
        иначе None
        '''
        if self.make_tree:
            assert hasattr(obj, 'parent_id')
            return obj.parent_id
        else:
            return None
            
    def get_children(self, obj):
        '''
        возвращает пало идишники детей
        '''
        assert self.make_tree
        assert callable(obj.get_children)
        children = self.model.objects.filter(parent=obj).values('pk')
        q = self._store_model.objects.filter(instance__in=children)
        return [o.palo_id for o in q]
        
    def get_palo_dim(self):
        '''
        вернуть PaloDimension и подключение к серверу
        '''
        p = PaloServer(server_host=self._server_host, user=self._user, password=self._password)
        p.login()
        db = p.get_or_create_db(self._db_name)
        
        if db.dimension_exists(self.name):
            dim = db.get_dimension(self.name)
        else:
            dim = db.create_dimension(self.name)
        return dim

    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        self._dim.clear()
        self._store_model.objects.all().delete()
        self._consolidate_store_model.objects.all().delete()
        
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''

        if not self.name:
            raise Exception(u'Не указано имя измерения для %s' % self.__class__.__name__)
        if with_clear:
            self.clear()
        
        if self.check_unique_name:
            self._not_unique_name = self.get_not_unique_names()
        result = dict()
        self.process_base_consolidate()
        result[u'Новых'] = self.process_new_items()
        result[u'Удаленных'] = self.process_deleted_items()
        result[u'Измененных'] = self.process_changed_items()
        
        return result
    
    def get_or_create_consolidate(self, name):
        try:
            return self._consolidate_store_model.objects.get(name=name).palo_id
        except self._consolidate_store_model.DoesNotExist:
            id = self._dim.create_element(self.all_name, ELEMENT_TYPE_CONSOLIDATED)
            st = self._consolidate_store_model()
            st.palo_id = id
            st.name = name
            st.save()
            return id
    
    def process_base_consolidate(self):
        '''
        создает или находит основные консолидайт эелменты "ВСЕ", "НЕ УКАЗАН"
        '''
        self._all_id = self.get_or_create_consolidate(self.all_name)
    
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

        print res
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
        return self.model.objects.all()
    
    
    def process_new_items(self):
        '''
        обработка новых элементов измерения (загрузка в palo server)
        '''
        self.__class__._delete_lock.acquire()
        try:
            append_to_consolidate = dict() #писок идишников модели (не пола) к которым надо добалвять идишники пало 
            #удалим все записи без кода пало
            uses = self._store_model.objects.values('instance_id')
            query = self.get_model_query()
            query = list(query.exclude(pk__in=uses).order_by('pk'))
            cached_id = dict() #кэш для хранения связе ид - пало-ид
            if query:
                names = map(self.get_name, query)
                range_id = self._dim.create_elements(names)
                #запомним созданные идишники
                for i, obj in enumerate(query):
                    st = self._store_model()
                    st.instance = obj
                    st.processed = True
                    st.palo_id = range_id[i]
                    st.last_action_time = datetime.datetime.now()
                    if self.make_tree:
                        #запомним родителя на момент обработки (чтоб потом знать из какого элемента его удлалили
                        st.instance_parent_id = self.get_parent(obj)
                    st.save()
                    cached_id[st.instance_id] = st.palo_id
                    #отметим что надо пересчитать консидайшен эелементы
                    parent = self.get_parent(obj)
                    if append_to_consolidate.has_key(parent):
                        append_to_consolidate[parent].append(st.palo_id)
                    else:
                        append_to_consolidate[parent] = [st.palo_id,]
                        
                #ну вот всех добавили теперь обработаем добавление в косолидейшен элементы
                for cons, childs in append_to_consolidate.items():
                    if cons is None:
                        cons_id = self.get_all_consolidate_element()
                    else:
                        cons_id = cached_id.get(cons)
                        if not cons_id:
                            cons_id = self.get_palo_id(cons) 
                    self._dim.append_to_consolidate_element(cons_id, childs)
            return len(query)
        finally:
            self.__class__._delete_lock.release()
            
    def get_all_consolidate_element(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        return self._all_id
            
    def get_palo_id(self, id):
        '''
        ковертирует ид моделив в пало ид
        '''
        return self._store_model.objects.get(instance=id).palo_id
    
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
        st = self._store_model.__name__.lower()
        filter = {'%s__palo_id__isnull' % st :False,
                  '%s__processed' % st :False,
                  }
        query = query.select_related(st).filter(**filter)
        table = connection.ops.quote_name(self._store_model._meta.db_table)
        query = query.extra(select={'palo_id':'%s.palo_id'%table,
                                    'olap_store_id':'%s.id'%table,})
        if self.make_tree:
            query = query.extra(select={'instance_parent_id':'%s.instance_parent_id'%table})
            query = query.extra(select={'store_id':'%s.id'%table})
            
        changed_parents = list() #список идишников модели (не пола) у ктороых поменялись родители

        query = list(query)
        if query:
            for obj in query:
                palo_id = obj.palo_id
                self._dim.renameElement(palo_id, self.get_name(obj))
                if self.make_tree:
                    #запомним родителей которых надо пересчитывать
                    new_parent = self.get_parent(obj)
                    old_parent = obj.instance_parent_id
                    if new_parent <> old_parent:
                        #элемент перенесли запомним нового и старого родителя
                        changed_parents.append(new_parent) 
                        changed_parents.append(old_parent)
                        st = self._store_model.objects.get(id=obj.olap_store_id)
                        st.instance_parent_id = new_parent
                        st.save() 
            #отметим что обработали    
            q = self._store_model.objects.filter(palo_id__isnull=False, processed=False, last_action_time__lte=start_proc_time)
            q.update(processed=True)
            for id in changed_parents:
                self.refresh_childrens(id)
        return len(query)
        
    def refresh_childrens(self, id):
        '''
        обновить детей у консолидайшен элемента по ид модели (не пало)
        '''
        obj = self.model.objects.get(pk=id)
        palo_id = self.get_palo_id(id)
        childs = self.get_children(obj)
        self._dim.replace_consolidate_element(palo_id, childs)
    
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
            if cls.make_tree:
                #обработаем элементы чей родитель он был
                q = cls._store_model.objects.filter(instance_parent=instance)
                q.update(instance_parent=None)
                
        finally:
            cls._delete_lock.release()
            

class BaseStoreRelatedModel(models.Model):
    '''
    модель для хранения связанных атрибутов для элементов выбранной модели
    наследники модели генерируеться автоматически
    '''
#    instance = models.ForeignKey('self') #этот атрибут сгенерируеться автоматически
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

