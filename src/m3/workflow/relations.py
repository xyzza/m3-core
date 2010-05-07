#coding:utf-8
'''
Модуль содержит описание процессов связей
'''
from m3.workflow.core import Workflow, BaseModelGenerator, GeneratorWorkflow
from django.db.models.base import ModelBase
from django.db import models
import itertools
import datetime
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
                models.ForeignKey(field_class).contribute_to_class(klass, field_name)
            existed_fields.append(field_name)
        assert len(existed_fields) > 0, 'No fields defined'
        
class MetaRelationModel(MetaWorkflowModel):
    ''' Метакласс модели связи. Добавляет поля связи в модель рабочего процесса '''
    def __new__(cls, name, bases, attrs):
        klass = super(MetaRelationModel, cls).__new__(cls, name, bases, attrs)
        # Начало образования связи
        models.DateTimeField(default = datetime.datetime.min).contribute_to_class(klass, 'start_date')
        # Конец действия связи
        models.DateTimeField(default = datetime.datetime.max).contribute_to_class(klass, 'end_date')

class GeneratorNamedDoc(BaseModelGenerator):
    ''' Генератор скрипта для таблицы именованных документов '''
    metaclass = 'm3_workflow.MetaNamedDocsModel'
    baseclass = 'models.Model'
    class_suffix = 'DocModel'
    table_suffix = 'Doc'
    
class GeneratorRelation(GeneratorWorkflow):
    metaclass = 'm3_workflow.MetaRelationModel'
    baseclass = 'm3_workflow.BaseWorkflowModel'

class Relation(Workflow):
    # Списоки кортежей состоящих из имени поля и класс документа
    open_docs = []  # Способных открыть новый процесс
    close_docs = [] # Способных закрыть процесс
    
    def __init__(self):
        super(Relation, self).__init__()
        # Добавляем свой класс генератор описывающий таблицу "именованных документов"
        self._model_generators.append(GeneratorNamedDoc)
        # Заменяем класс workflow генератора на relation генератор
        self._model_generators.remove(GeneratorWorkflow)
        self._model_generators.insert(0, GeneratorRelation)
        