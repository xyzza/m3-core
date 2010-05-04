#coding:utf-8
'''
Модуль содержит описание процессов связей
'''
from m3.workflow.core import Workflow
from django.db.models.base import ModelBase
from django.db import models

class WorkflowNamedDocsModelBase(ModelBase):
    ''' Базовый метакласс для модели хранящей именованные документы '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowNamedDocsModelBase, cls).__new__(cls, name, bases, attrs)
        # Ссылка на сам экземпляр процесса
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').\
               contribute_to_class(klass, 'workflow')
        # Ссылки на открывающие документы
        
        # Ссылки на закрывающие документы
        

class Relation(Workflow):
    # Списоки кортежей состоящих из имени поля и класс документа
    open_docs = []  # Способных открыть новый процесс
    close_docs = [] # Способных закрыть процесс
    
    def __init__(self):
        super(Relation, self).__init__()
        # Добавляем свою генераторную функцию описывающую таблицу "именованных документов"
        # НЕ РАБОТАЕТ ТУТ!!!
        #self._model_factory_methods.append(self._model_gen_nameddocs)
        
    def _model_gen_nameddocs(self):
        ''' Функция генерирующая код для таблицы именованных документов '''
        assert len(self.Meta.open_docs) > 0, 'Must be specified at least one the opening document'
        assert len(self.Meta.close_docs) > 0, 'Must be specified at least one the closing document'
        WORKFLOW_NAMED_DOCS_MODEL_TEMPLATE = '''
class %(class_name)sNamedDocModel(models.Model):
    __metaclass__ = m3_workflow.WorkflowNamedDocsModelBase
    class Meta:
        db_table = '%(db_table)sNamedDoc'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        result = WORKFLOW_NAMED_DOCS_MODEL_TEMPLATE % self._model_gen_parameters()
        return result
        
        