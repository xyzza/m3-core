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
        assert isinstance(objects, dict) and isinstance(open_docs, dict)
        # Создаем новое состояние процесса
        workflow = self.workflow()
        state = self.models.state(step = workflow.state_opened.id)
        state.save()
        
        # Создаем запись связи
        relation = self.models.wf(state = state)
        relation.save()
        state.workflow = relation
        state.save()
        
        # Создаем запись рабочего набора
        working_set = self.models.wso(workflow = relation)
        for field_name, obj in objects.items():
            #assert hasattr(working_set, field_name), 'The working set models does not contain a field with the name %s' % field_name
            # В качестве значения могут передаваться как сами записи, так и их id
            if isinstance(obj, int):
                field_name += '_id'
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
        
        workflow.id = relation.id
        workflow.record = relation
        return workflow
    
    def filter(self, objects, **kwargs):
        '''
        Выполняет запрос к связям по бизнес ключу заданному объектами рабочего набора objects
        В качестве аргументов kwargs могут идти следующие ключи:
          1. opened: bool default True - отбирать только открытые связи
          2. start_soft - мягкое начало периода
          3. start_hard - жесткое начало периода
          4. end_soft - мягкий конец периода
          5. end_hard - жесткий конец период
        Мягкие отличаются от жестких тем, что они включают связи которые частично попадают в период.
        '''
        query = self.models.wso.objects
        # Накладываем фильтр по бизнес-ключу
        for field_name, obj in objects:
            wso_class_name = self.models.wso.__name__.lower()
            filter_key = wso_class_name + '__' + field_name
            query = query.filter({filter_key: obj})
        # Накладываем фильтр по состоянию
        state_class_name = self.models.state.__name__.lower()
        opened = kwargs.pop('opened', True)
        step_id = self.workflow.state_opened.id if opened else self.workflow.state_closed.id
        query = query.filter({state_class_name + '__step': step_id})
        # Накладываем фильтр по периодам действия
        start_date = start_mode = None
        if kwargs.haskey('start_hard'):
            start_date = kwargs.pop('start_hard')
            start_mode = 'hard'
        elif kwargs.haskey('start_soft'):
            start_date = kwargs.pop('start_soft')
            start_mode = 'soft'
        else:
            raise Exception('Start date must be defined!')
        
        end_date = end_mode = None
        if kwargs.haskey('end_hard'):
            end_date = kwargs.pop('end_hard')
            end_mode = 'hard'
        elif kwargs.haskey('end_soft'):
            end_date = kwargs.pop('end_soft')
            end_mode = 'soft'
        else:
            raise Exception('End date must be defined!')
        
        raise NotImplementedError()
    
    def get(self, id):
        '''
        Возвращает экземпляр связи с заданным id
        '''
        wf = self.workflow()
        wf.id = id
        wf.record = self.models.wf.objects.get(id = id)
        return wf
    

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
    
    @transaction.commit_on_success
    def close(self, date):
        '''
        Закрывает текущую связь на заданную дату date
        '''
        # Проверяем не закрыта ли уже текущая связь?
        current_wf = self.models.wf.objects.get(id = self.id)
        current_state = current_wf.state
        if current_state.step == self.state_closed.id:
            raise Exception(u'Relation with id=%s already closed!' % self.id)
        # Создаем новое состояние
        params = {'step'     : self.state_closed.id,
                  'workflow' : current_wf,
                  'from_step': current_state.step}
        closed_state = self.models.state.objects.create(**params)
        # Указываем наш WF на новый степ
        current_wf.state = closed_state
        current_wf.end_date = date
        current_wf.save()
        
    @transaction.commit_on_success
    def delete(self):
        '''
        Физическое удаление записей связи
        '''
        # Каскадное удаление процесса
        current_wf = self.models.wf.objects.get(id = self.id)
        current_wf.delete()
    
    class Meta:
        # Списоки кортежей состоящих из имени поля и класс документа
        open_docs = []  # Способных открыть новый процесс
        close_docs = [] # Способных закрыть процесс
        