#coding:utf-8
from django.db import models, signals
import datetime
import copy

class BaseModelBassedPaloDimension(object):
    '''
    класс для описания дименшена на основании модели
    '''
    model = None #моедель на основании котороу бедм стороить дименшен
    
    store_model = None #автогенерируемая модель для хранения доп атрибутов для элементов основно модели
    
    @classmethod
    def register(cls):
        '''
        зарегистрировать модель, делает такое:
        - создание динамических моделей на базе BaseStoreRelatedModel
        - подключение к сигналам post_save, post_delete целевой модели
        '''
        cls.create_store_model()
        cls.connect_signals()
 
        
    @classmethod
    def connect_signals(cls):
        pass

    @classmethod
    def create_store_model(cls):
        fk = models.ForeignKey(cls.model, null=True)
        model_name = cls.__name__ + '_store' 
        attrs = dict(__module__=cls.__module__)
        cls.store_model = type(model_name, (BaseStoreRelatedModel,), attrs)
        cls.store_model._meta.fields.append(fk)
#        fk.contribute_to_class(cls.store_model, 'instance')
        

    @classmethod
    def process(cls):
        '''
        обработка измерения (загрузка в palo server)
        '''
        start_proc_time = datetime.datetime.now()
        
        cls.process_new_items()
                
        cls.models.filter(processed=False, last_action_time=start_proc_time).update(processed=True)
    
    @classmethod
    def process_new_items(cls):
        '''
        обработка новых элементов измерения (загрузка в palo server)
        '''
        print 'new'
        query = cls.model.select_related(cls.store_model).filter(palo_id__isnull=False)
        for obj in query:
            pass
        
    @classmethod
    def post_save_model(cls, instance):
        '''
        обработка сигнала сохранения связанной модели
        '''
        cls.store_model.objects.filter(instance=instance).update(processed = False, \
                                                                 last_action_time=datetime.datetime.now())

    @classmethod
    def post_delete_model(cls, instance):
        '''
        обработка сигнала удаления целевой модели
        '''
        cls.store_model.objects.filter(instance=instance).update(processed = False, \
                                                                 deleted = True, \
                                                                 last_action_time=datetime.datetime.now())

class BaseStoreRelatedModel(models.Model):
    '''
    модель для хранения связанных атрибутов для элементов выбранной модели
    модель генерируеться автоматически
    '''
    #instance = models.ForeignKey(Model) #этот атрибут сгенерируеться автоматически
    palo_id = models.IntegerField(null=True)
    processed = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    last_action_time = models.DateTimeField()
    class Meta:
        abstract = True


