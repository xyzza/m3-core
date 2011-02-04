#coding:utf-8

from m3.contrib.palo_olap.dimensions.model_based import ModelBasedPaloDimension
from django.db import models
import datetime

class TreeModelBasedPaloDimension(ModelBasedPaloDimension):
    '''
    дименшен на основании древовидной модели 
    '''
    @classmethod
    def add_attr_to_store_model(cls, attrs):
        '''
        метод добавляет дополнительные атрибуты для генерируемой модели
        '''
        super(TreeModelBasedPaloDimension, cls).add_attr_to_store_model(attrs)
        #для древовидной структыры нам надо помнить родителя т.к. если эелмент переносят в другую ветку то из какой перенесли мы узнаем отсюда
        attrs['instance_parent'] = models.ForeignKey(cls.model, null=True, related_name=cls.get_store_related_name() + '_parent')  
    
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
            #обработаем элементы чей родитель он был
            q = cls._store_model.objects.filter(instance_parent=instance)
            q.update(instance_parent=None)
                
        finally:
            cls._delete_lock.release()
            
    def get_parent(self, obj):
        '''
        возвращает ид родителя (ид модели)
        '''
        assert hasattr(obj, 'parent_id')
        return obj.parent_id
            
    def get_children(self, obj):
        '''
        возвращает query с детьми 
        '''
        q = self.get_model_query()
        q = q.filter(parent=obj).order_by(*self.sort_fields)
        return q

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
            st = self.get_store_related_name()
            query = self.get_model_query()
            query = query.select_related(st).filter(**{'%s__palo_id__isnull'%st:True})
            #query = query.exclude(pk__in=uses).order_by('pk')
            query = list(query)
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
                    cached_id[st.instance_id] = st.palo_id
                    st.last_action_time = datetime.datetime.now()
                    st.instance_parent_id = self.get_parent(obj)
                    st.save()
                    #отметим что надо пересчитать консидайшен эелементы
                    parent = self.get_parent(obj)
                    add_to_dict_list(append_to_consolidate, parent, st.palo_id)
                        
                #ну вот всех добавили теперь обработаем добавление в косолидейшен элементы
                for cons, childs in append_to_consolidate.items():
                    if cons is None:
                        cons_id = self.get_all_consolidate_element_id()
                    else:
                        cons_id = cached_id.get(cons)
                        if not cons_id:
                            cons_id = self.get_palo_id(cons) 
                    self._dim.append_to_consolidate_element(cons_id, childs)
            return len(query)
        finally:
            self.__class__._delete_lock.release()
            
    
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
        query = self.get_children(obj).select_related(self.get_store_related_name())
        childs = map(self.get_palo_id, query)
        self._dim.replace_consolidate_element(self.get_palo_id(obj), childs)
