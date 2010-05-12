#coding:utf-8
'''
Модуль содержит описание процессов связей
'''
import itertools
from datetime import datetime

from django.db.models.base import ModelBase
from django.db import models, transaction

from m3.workflow.core import Workflow, BaseModelGenerator, GeneratorWorkflow, WorkflowQueryManager,\
    WorkflowStep
from m3.workflow.meta import MetaWorkflowModel

class MetaNamedDocsModel(ModelBase):
    ''' Базовый метакласс для модели хранящей именованные документы '''
    def __new__(cls, name, bases, attrs):
        klass = super(MetaNamedDocsModel, cls).__new__(cls, name, bases, attrs)
        wf = klass.WorkflowMeta.workflow
        # Ссылка на сам экземпляр процесса
        models.ForeignKey(wf.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')

        # Ссылки на открывающие документы и закрывающие документы
        open_docs = getattr(wf.Meta, 'open_docs', [])
        close_docs = getattr(wf.Meta, 'close_docs', [])
        assert len(open_docs) > 0, 'Must be specified at least one the opening document'
        assert len(close_docs) > 0, 'Must be specified at least one the closing document'
        existed_fields = []
        for field_name, field_class in itertools.chain(open_docs, close_docs):
            if field_name not in existed_fields:
                models.ForeignKey(field_class, blank = True, null = True).contribute_to_class(klass, field_name)
            existed_fields.append(field_name)
        assert len(existed_fields) > 0, 'No fields defined'
        
        return klass
        
class MetaRelationModel(MetaWorkflowModel):
    ''' Метакласс модели связи. Добавляет поля связи в модель рабочего процесса '''
    def __new__(cls, name, bases, attrs):
        klass = super(MetaRelationModel, cls).__new__(cls, name, bases, attrs)
        # Начало образования связи
        models.DateTimeField(default = datetime.min).contribute_to_class(klass, 'start_date')
        # Конец действия связи
        models.DateTimeField(default = datetime.max).contribute_to_class(klass, 'end_date')
        return klass

class GeneratorNamedDoc(BaseModelGenerator):
    ''' Генератор скрипта для таблицы именованных документов '''
    metaclass = 'm3_workflow.MetaNamedDocsModel'
    baseclass = 'models.Model'
    class_suffix = 'DocModel'
    table_suffix = 'Doc'
    attribute = 'nameddocs'
    
class GeneratorRelation(GeneratorWorkflow):
    metaclass = 'm3_workflow.MetaRelationModel'
    baseclass = 'm3_workflow.BaseWorkflowModel'
    
class RelationQueryManager(WorkflowQueryManager):
    '''
    Менеджер запросов предоставляющий функции для работы со связями
    '''
    def __init__(self, *args, **kwargs):
        super(RelationQueryManager, self).__init__(*args, **kwargs)
    
    @transaction.commit_on_success
    def create(self, objects = {}, open_docs = {}, date = datetime.min):
        '''
        Создает новую открытую связь для объектов objects, открытых документами open_docs на дату date
        @param objects: словарь, где ключи имена полей, а значения экземпляры объектов рабочего набора
        @param open_docs: словарь, где ключи имена полей, а значения экземпляры документов
        @param date: дата с которой включительно начинает действовать связь
        '''
        assert isinstance(objects, dict) and isinstance(open_docs, dict) and isinstance(date, datetime)
        # Создаем новое состояние процесса
        workflow = self.workflow()
        state = self.models.state(step = workflow.state_opened.id)
        state.save()
        # Создаем запись связи
        relation = self.models.wf(state = state)
        relation.save()
        # Создаем запись рабочего набора
        working_set = self.models.wso(workflow = relation)
        for field_name, obj in objects.items():
            #assert hasattr(working_set, field_name), 'The working set models does not contain a field with the name %s' % field_name
            setattr(working_set, field_name, obj)
        working_set.save()
        # Таблица именованных документов
        open_types = tuple([x[1] for x in self.workflow.Meta.open_docs])
        named_docs = self.models.nameddocs(workflow = relation)
        for field_name, obj in open_docs.items():
            assert hasattr(named_docs, field_name), 'The named docs models does not contain a field with the name %s' % field_name
            assert isinstance(obj, open_types), 'Document type is not included in the types of opening documents. Look attribute open_docs in Meta.'
            setattr(named_docs, field_name, obj)
        named_docs.save()
        #TODO: Пока не знаю нужно ли делать записи в док-модели (модели созданных процессом документов), т.к.
        # они не используются в запросах
        
    
    def filter(self, objects, **kwargs):
        '''
        Выполняет запрос к связям
        '''
        query = self.models.wso.objects
        for field_name, obj in objects:
            query = query.filter({field_name: obj})
        
        return query
    
    def get(self, id):
        '''
        Возвращает экземпляр связи с заданным id
        '''
        raise NotImplementedError()

class RelationOpenedStep(WorkflowStep):
    id = 'opened'
    name = 'Открыто'

class RelationClosedStep(WorkflowStep):
    id = 'closed'
    name = 'Закрыто'


class Relation(Workflow):
    _objects_class = RelationQueryManager
    
    def __init__(self):
        super(Relation, self).__init__()
        # Добавляем свой класс генератор описывающий таблицу "именованных документов"
        self._model_generators.append(GeneratorNamedDoc)
        # Заменяем класс workflow генератора на relation генератор
        self._model_generators.remove(GeneratorWorkflow)
        self._model_generators.insert(0, GeneratorRelation)
        # Состояния
        self.state_opened = RelationOpenedStep()
        self.state_closed = RelationClosedStep()
        
    class Meta:
        # Списоки кортежей состоящих из имени поля и класс документа
        open_docs = []  # Способных открыть новый процесс
        close_docs = [] # Способных закрыть процесс
        