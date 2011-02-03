#coding:utf-8
from django.db import models, connection
from django.db.models import Q
import datetime
import copy
from m3.contrib.palo_olap.server_api.server import PaloServer
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_NUMERIC
import threading
from dimension import BasePaloDimension

class ModelBassedPaloDimension(BasePaloDimension):
    '''
    класс для описания дименшена на основании модели
    '''
    model = None #моедель на основании котороу бедм стороить дименшен
    unknow_name = u'Неизвестно' #задает имя элемента НЕИЗВЕСТО если задать None то создавать не будет
    name_field = 'name' #поле в котором лежит имя или можно перекрыть функцию get_name которая будет возвращать имя в этом случае не забудь перекрыть функции get_not_unique_names
    check_unique_name = True #проверять уникальность имени (черещ процедуру get_not_unique_names
    make_tree = False #надо ли создавать древовидную структуру (если до то надо определить get_parent(obj), get_childrens(obj) если модель не mptt
    make_virtual_consolidate_element = False #работает своместно с make_tree если да то узлы дерева будут виртуальными а сами узловые элементы будут в корне дерева 
     
    
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
    def create_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало и информации о изменнии элементов целевой модели
        созданеи ведеться путем наследования от BaseStoreRelatedModel и добавление instance = ForeignKey
        '''
        model_name = cls.__name__ + 'Store' 
        attrs = dict()
        attrs['__module__'] =  cls.__module__
        attrs['instance'] = models.OneToOneField(cls.model, null=True, related_name = cls.get_store_related_name())
        if cls.make_tree:
            #для древовидной структыры нам надо помнить родителя т.к. если эелмент переносят в другую ветку то из какой перенесли мы узнаем отсюда
            attrs['instance_parent'] = models.ForeignKey(cls.model, null=True, related_name=cls.get_store_related_name() + '_parent')  
            if cls.make_virtual_consolidate_element:
                #для древовидной структыры мы будем генерировать виртуальные узля и хранить их идишники
                attrs['consolidate_palo_id'] = models.IntegerField(null=True)  
        cls._store_model = type(model_name, (BaseStoreRelatedModel,), attrs)
        
    @classmethod
    def create_consolidate_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало для консолидированных элементов
        созданеи ведеться путем наследования от BaseConsolidateStoreModel 
        '''
        model_name = cls.__name__ + 'ConsolidateStore' 
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
        возвращает query с детьми 
        '''
        assert self.make_tree
        q = self.get_model_query()
        q = q.filter(parent=obj)
        return q
        
    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        super(ModelBassedPaloDimension, self).clear()
        self._store_model.objects.all().delete()
        self._consolidate_store_model.objects.all().delete()
        
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''

        super(ModelBassedPaloDimension, self).process(with_clear)
        
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

    def process_base_elements(self):
        '''
        создает или находит основные консолидайт эелменты "ВСЕ", "НЕ УКАЗАН"
        '''
        if self.need_all_consolidate_element:
            self._all_id = self.get_or_create_consolidate_element(self.get_all_consolidate_element_name())
        if self.unknow_name:
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
        return self.model.objects.all()
    
    def need_virtual_consolidate_element(self, obj):
        '''
        если стоит флаг make_virtual_consolidate эта функция используется для проверки нужно ли создавать 
        виртуальный консолидайт
        можно было без нее по паренты но с ней быстрее
        '''
        return not obj.is_leaf_node()
    
    def get_name_for_consolidate(self, obj, virtual):
        '''
        генерирует имена для консолидирующих элементов в случае установки self.make_virtual_consolidate_element
        virtual == True значит подчиненный консоидирующему его ид в palo_id на него будет вешаться собсвенные данные
        virtual == False значит сам консолидирующий его ид в consolidate_palo_id на него нельзя вешать собвенные данные
        '''
        if virtual:
            name =  u'Только %s' % self.get_name(obj)
        else:
            name = self.get_name(obj)
        return name
        
    def process_new_items(self):
        '''
        обработка новых элементов измерения (загрузка в palo server)
        '''
        def add_to_dict_list(dict, key, value):
            if dict.has_key(key):
                dict[key].append(value)
            else:
                dict[key] = [value,]
            
        self.__class__._delete_lock.acquire()
        try:
            append_to_consolidate = dict() #писок идишников модели (не пола) к которым надо добалвять идишники пало 
            #удалим все записи без кода пало
            uses = self._store_model.objects.values('instance_id')
            st = self.get_store_related_name()
            query = self.get_model_query()
            query = query.select_related(st).filter(**{'%s__palo_id__isnull'%st:True})
            #query = query.exclude(pk__in=uses).order_by('pk')
            query = list(query)
            cached_id = dict() #кэш для хранения связе ид - пало-ид
            if query:
                if not self.make_virtual_consolidate_element:
                    names = map(self.get_name, query)
                else:
                    #,надо генерировать виртуальный коснолидаты значит надо увеличивать имена
                    names = []
                    for obj in query:
                        if not self.need_virtual_consolidate_element(obj):
                            names.append(self.get_name(obj))
                        else:
                            names.append(self.get_name_for_consolidate(obj, True))
                            names.append(self.get_name_for_consolidate(obj, False))
                            
                range_id = self._dim.create_elements(names)
                #запомним созданные идишники
                i = 0
                for obj in query:
                    st = self._store_model()
                    st.instance = obj
                    st.processed = True
                    st.palo_id = range_id[i]
                    cached_id[st.instance_id] = st.palo_id
                    i = i + 1
                    st.last_action_time = datetime.datetime.now()
                    parent = None #добавить в элемент ВСЕ
                    if self.make_tree:
                        parent = self.get_parent(obj)
                        #запомним родителя на момент обработки (чтоб потом знать из какого элемента его удлалили
                        st.instance_parent_id = self.get_parent(obj)
                        if self.make_virtual_consolidate_element and self.need_virtual_consolidate_element(obj):
                            #был сгенирирован вирутальный консолидайт сохраним его
                            st.consolidate_palo_id = range_id[i]
                            cached_id[st.instance_id] = st.consolidate_palo_id
                            i = i + 1
                            #отметим что надо обработать консолидирующие эмеленты
                            add_to_dict_list(append_to_consolidate, parent, st.consolidate_palo_id)
                            parent = st.instance_id
                    st.save()
                    #отметим что надо пересчитать консидайшен эелементы
                    add_to_dict_list(append_to_consolidate, parent, st.palo_id)
                        
                #ну вот всех добавили теперь обработаем добавление в косолидейшен элементы
                for cons, childs in append_to_consolidate.items():
                    if cons is None:
                        cons_id = self.get_all_consolidate_element_id()
                    else:
                        cons_id = cached_id.get(cons)
                        if not cons_id:
                            cons_id = self.get_palo_id(cons, need_consolidate=True) 
                    self._dim.append_to_consolidate_element(cons_id, childs)
            return len(query)
        finally:
            self.__class__._delete_lock.release()
            
            
    def get_unknown_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        assert self._processed
        return self._unknown_id
    
    def check_virtual_consolidate_element(self, obj):
        '''
        процедура занимает проверкой виртуальной древовидности элемента
        '''
        assert self.make_virtual_consolidate_element
        store = getattr(obj, self.get_store_related_name())
        if self.need_virtual_consolidate_element(obj):
            #нужен виртуальный элмент
            if store.consolidate_palo_id is None:
                #блин, до этого этот элемент не имел консолидайта
                self.create_virtual_consolidate_element(obj, store) 
        else:
            if store.consolidate_palo_id is not None:
                #блин, до этого этот элемент имел консолидайта а теперь не должен
                self.delete_virtual_consolidate_element(obj, store)
        
    
    def get_palo_id(self, id_or_obj, need_consolidate=False):
        '''
        ковертирует ид моделив в пало ид
        id_or_obj может быть либо идишником либо объектов
        need_consolidate - если мы хотим получить ид виртуального элемента
        процедура к тому же занмиается проверкой на корректность вирутуальности элемента 
        путем вызова check_virtual_consolidate_element
        '''
        if isinstance(id_or_obj, models.Model):
            #у нас в руках объект
            obj = id_or_obj
        else:
            #у нас в руках идишник
            obj = self.get_model_query().select_related(self.get_store_related_name()).get(pk=id_or_obj)
        st = getattr(obj, self.get_store_related_name())
            
        if self.make_virtual_consolidate_element and need_consolidate:
            self.check_virtual_consolidate_element(obj)
            if st.consolidate_palo_id is not None:
                return st.consolidate_palo_id
                    
        return st.palo_id
    
    
    def create_virtual_consolidate_element(self, obj, store):
        '''
        пересоздать элемент с типом консолидирующий с  виртуальным
        точнее создать консолидайт и перевести в ьего подчинение виртуальный
        (идишники в сторо двигаются)
        '''
        assert store.palo_id is not None
        assert store.consolidate_palo_id is None
        store.consolidate_palo_id = store.palo_id
        self._dim.renameElement(store.consolidate_palo_id, self.get_name_for_consolidate(obj, False))
        store.palo_id = self._dim.create_element(self.get_name_for_consolidate(obj, True))
        store.save()
        
        self._dim.replace_consolidate_element(store.consolidate_palo_id, [store.palo_id,])
        
    def delete_virtual_consolidate_element(self, obj, store):
        '''
        пересоздать элемент с типом консолидирующий с  виртуальным
        точнее удлаить вирутальный элемент и сделать элемент просто элементом
        (идишники в сторо двигаются)
        '''
        assert store.palo_id is not None
        assert store.consolidate_palo_id is not None
        self._dim.deleteElement(store.palo_id)
        store.palo_id = store.consolidate_palo_id
        self._dim.renameElement(store.palo_id, self.get_name(obj))
        store.consolidate_palo_id = None
        store.save()
        
        self._dim.replace_element(store.palo_id) #сменим тип

    def process_deleted_items(self):
        '''
        обработка удаленных элементов измерения (удаление из palo server)
        '''
        query = self._store_model.objects.filter(palo_id__isnull=False, deleted=True, last_action_time__lte=datetime.datetime.now())
        cnt = 0
        if query:
            for obj in query:
                self._dim.deleteElement(obj.palo_id)
                if getattr(obj, 'consolidate_palo_id', None) is not None:
                    #удалим вирутальный элемент тоже
                    self._dim.deleteElement(obj.consolidate_palo_id)
                if self.make_virtual_consolidate_element and self.make_tree and obj.instance_parent_id:
                    self.check_virtual_consolidate_element(obj.instance_parent)
                    
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
        
        changed_parents = list() #список идишников модели (не пола) у ктороых поменялись родители

        query = list(query)
        if query:
            for obj in query:
                palo_id = getattr(obj, st).palo_id
                if self.make_virtual_consolidate_element:
                    self.check_virtual_consolidate_element(obj)
                    palo_id = getattr(obj, st).palo_id
                if self.make_virtual_consolidate_element and self.need_virtual_consolidate_element(obj):
                    consolidate_palo_id = getattr(obj, st).consolidate_palo_id
                    self._dim.renameElement(palo_id, self.get_name_for_consolidate(obj, True))
                    self._dim.renameElement(consolidate_palo_id, self.get_name_for_consolidate(obj, False))
                else:
                    self._dim.renameElement(palo_id, self.get_name(obj))
                if self.make_tree:
                    #запомним родителей которых надо пересчитывать
                    new_parent = self.get_parent(obj)
                    old_parent = getattr(obj, st).instance_parent_id
                    if new_parent <> old_parent:
                        #элемент перенесли запомним нового и старого родителя
                        changed_parents.append(new_parent) 
                        changed_parents.append(old_parent)
                        st = self._store_model.objects.get(id=getattr(obj, st).id)
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
        obj = self.get_model_query().select_related(self.get_store_related_name()).get(pk=id)
        palo_id = self.get_palo_id(id, need_consolidate=True)
        st = self.get_store_related_name()
        query = self.get_children(obj).select_related(st)
        childs = []
        for child in query:
            childs.append(self.get_palo_id(child, need_consolidate=True))
        if self.need_virtual_consolidate_element(obj):
            #добавим виртуал в дети
            self.check_virtual_consolidate_element(obj)
            childs.append(self.get_palo_id(obj))
        
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

