#coding:utf-8
from django.db import models, connection
from django.db.models import Q
import datetime

#coding:utf-8

from m3.contrib.palo_olap.dimensions.tree_model_based import TreeModelBasedPaloDimension
from django.db import models
import datetime

class VirtualTreeModelBasedPaloDimension(TreeModelBasedPaloDimension):
    '''
    дименшен на основании древовидной модели
    c созданием вирутальных узловых элементов
    сами элементы узлов становться подчиненными 
    сделано ля того чтобы можно было разносить таблицу фактов на узля дерева 
    '''
    @classmethod
    def add_attr_to_store_model(cls, attrs):
        '''
        метод добавляет дополнительные атрибуты для генерируемой модели
        '''
        super(VirtualTreeModelBasedPaloDimension, cls).add_attr_to_store_model(attrs)
        #для древовидной структыры мы будем генерировать виртуальные узля и хранить их идишники
        attrs['consolidate_palo_id'] = models.IntegerField(null=True)  
    
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
                    parent = self.get_parent(obj)
                    #запомним родителя на момент обработки (чтоб потом знать из какого элемента его удлалили
                    st.instance_parent_id = parent
                    if self.need_virtual_consolidate_element(obj):
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
            
    
    def check_virtual_consolidate_element(self, obj):
        '''
        процедура занимает проверкой виртуальной древовидности элемента
        '''
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
            
        if need_consolidate:
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
                if obj.instance_parent_id:
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
                self.check_virtual_consolidate_element(obj)
                palo_id = getattr(obj, st).palo_id
                if self.need_virtual_consolidate_element(obj):
                    consolidate_palo_id = getattr(obj, st).consolidate_palo_id
                    self._dim.renameElement(palo_id, self.get_name_for_consolidate(obj, True))
                    self._dim.renameElement(consolidate_palo_id, self.get_name_for_consolidate(obj, False))
                else:
                    self._dim.renameElement(palo_id, self.get_name(obj))
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
        palo_id = self.get_palo_id(obj, need_consolidate=True)
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
    
            

        
        
        
