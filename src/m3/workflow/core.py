#coding:utf-8
'''
Модуль содержит основные класс и описание моделей рабочих процессов
'''

from django.db import models
from m3.workflow.exceptions import ImproperlyConfigured

#============================================================================
#====================== Шаги рабочего процесса ==============================
#============================================================================
class WorkflowStep(object):
    def __init__(self, id='', name='', *args, **kwargs):
        self.id = id # уникальный в пределах одного рабочего процесса идентификатор шага
        self.__name = name if name.strip() else self.id

    def __get_name(self):
        return self._name;
    
    name = property(__get_name)
    
class WorkflowStartStep(WorkflowStep):
    def __init__(self,):
        super(WorkflowStartStep, self).__init__(id='new', name='Новый')
        
class WorkflowEndStep(WorkflowStep):
    def __init__(self):
        super(WorkflowEndStep, self).__init__(id='closed', name='Закрыто')


#============================================================================
#=================== БАЗОВЫЙ КЛАСС РАБОЧЕГО ПРОЦЕССА ========================
#============================================================================
class Workflow(object):
    def __init__(self, *args, **kwargs):
        self.start_step = WorkflowStartStep()
        self.end_step = WorkflowEndStep()
        self.steps=[]
        
        # Уникальный по системе идентификатор рабочего процесса.
        self.id = ''
        
        # Список функций генерирующих код для общего скрипта моделей процесса
        # Так было сделано для возможности перекрыть скрипт каждой отдельной таблицы в потомках
        self._model_factory_methods = [self._model_gen_workflow,
                                       self._model_gen_step,
                                       self._model_gen_child,
                                       self._model_gen_wso,
                                       self._model_gen_docs]
    
    @classmethod
    def meta_class_name(cls):
        '''
        Возвращает имя класса (без префикса модуля)
        '''
        return cls.__name__
    
    @classmethod
    def meta_full_class_name(cls):
        '''
        Возвращает полное квалифицирующее имя класса рабочего потока
        '''
        return cls.__module__ + '.' + cls.__name__
    
    @classmethod    
    def meta_dbtable(cls):
        '''
        Возвращает название таблицы для текущего рабочего потока 
        '''
        try:
            return cls.Meta.db_table
        except:
            raise ImproperlyConfigured('For the class of workflow ' + cls.meta_full_class_name() + ' attribute not set Meta.db_table')
    
    def _model_gen_parameters(self):
        ''' Возвращает словарь с параметрами необходимыми для рендеринга скрипта модели '''
        params = {'class_name': self.__class__.__name__,
                  'db_table':   self.meta_dbtable()}
        return params
    
    def _model_gen_workflow(self):
        ''' Генерирует код самой модели процесса '''
        WORKFLOW_MODEL_TEMPLATE = '''
class %(class_name)sModel(m3_workflow.WorkflowModel):
    __metaclass__ = m3_workflow.WorkflowModelBase
    class Meta:
        db_table = '%(db_table)s'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        result = WORKFLOW_MODEL_TEMPLATE % self._model_gen_parameters()
        return result
        
    def _model_gen_step(self):
        ''' Генерирует код шагов процесса '''
        WORKFLOW_STEP_MODEL_TEMPLATE = '''
class %(class_name)sStateModel(m3_workflow.WorkflowStepModel):
    __metaclass__ = m3_workflow.WorkflowStateModelBase
    class Meta:
        db_table = '%(db_table)sState'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        result = WORKFLOW_STEP_MODEL_TEMPLATE % self._model_gen_parameters()
        return result
    
    def _model_gen_child(self):
        ''' Генерирует код для модели дочерних процессов '''
        WORKFLOW_CHILD_MODEL_TEMPLATE = '''
class %(class_name)sChildModel(m3_workflow.WorkflowStepModel):
    __metaclass__ = m3_workflow.WorkflowChildModelBase
    class Meta:
        db_table = '%(db_table)sChild'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        result = WORKFLOW_CHILD_MODEL_TEMPLATE % self._model_gen_parameters()
        return result
        
    def _model_gen_wso(self):
        ''' Генерирует код для модели рабочего набора процесса '''
        WORKFLOW_WSO_MODEL_TEMPLATE = '''
class %(class_name)sWSOModel(m3_workflow.WorkflowWSOModel):
    __metaclass__ = m3_workflow.WorkflowWSOModelBase
    class Meta:
        db_table = '%(db_table)sWSO'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        result = WORKFLOW_WSO_MODEL_TEMPLATE % self._model_gen_parameters()
        return result
    
    def _model_gen_docs(self):
        '''  '''
        WORKFLOW_DOC_MODEL_TEMPLATE = '''
class MyWorkflow_MyDocument_DocModel(m3_workflow.WorkflowDocModel):
    __metaclass__ = m3_workflow.WorkflowDocModelBase
    document = models.ForeignKey(%(DocModel)s)
    class Meta:
        db_table = '%(db_table)s'
    class WorkflowMeta:
        workflow = %(class_name)s
        '''
        documents = getattr(self.Meta, 'documents', [])
        result = ''
        for doc in documents:
            assert isinstance(doc, WorkflowDocument)
            result += WORKFLOW_DOC_MODEL_TEMPLATE % \
                     {'class_name': self.__class__.__name__,
                      'db_table':   self.meta_dbtable() + doc.document_class.document_class,
                      'DocModel':   doc.document_class.__name__}
        return result
    
    @classmethod
    def create_workflow_models(cls):
        ''' Возвращает полный, готовый для выполнения скрипт, генерирующий все модели процесса '''
        header = '''
from m3 import workflow as m3_workflow
import %(workflow_module)s
        '''
        header = header % {'workflow_module': cls.__module__}
        wf = cls()
        for gen_method in wf._model_factory_methods:
            script = gen_method()
            header += '\n' + script
        return header
    
#============================================================================
#=================== БАЗОВЫЕ КЛАССЫ МОДЕЛЕЙ ПРОЦЕССА ========================
#============================================================================
class WorkflowModel(models.Model):
    '''
    Базовый класс для хранимых моделей рабочих потоков
    '''
    class Meta:
        abstract = True

class WorkflowStepModel(models.Model):
    '''
    Базовый класс для хранимых моделей шагов рабочих процессов
    '''
    class Meta:
        abstract = True
        
class WorkflowWSOModel(models.Model):
    class Meta:
        abstract = True

class WorkflowDocModel(models.Model):
    class Meta:
        abstract = True
        
#===============================================================================
# Непонятно что
#===============================================================================

class WorkflowWSObject(object):
    '''
    #TODO: Пока не понятно что это?
    '''
    def __init__(self, wso_class, wso_field):
        '''
        @param wso_class: задает класс модели, которая будет входить в рабочий набор потока
        @param wso_field: задает имя поля, которое используется для храненения идентификатора 
                          соответствующего объекта в моделе WorkflowWSORefModel.
        '''
        self.wso_class = wso_class
        self.wso_field = wso_field

class WorkflowDocument(object):
    '''
    #TODO: Пока не понятно что это?
    '''
    def __init__(self, document_class, document_db_subname):
        self.document_class = document_class
        self.document_db_subname = document_db_subname
    
#===============================================================================
# Переходы рабочего процесса
#===============================================================================
class WorkflowTransition(object):
    def __init__(self, from_step_id, to_step_id, *args, **kwargs):
        self.from_step = None
        self.to_step = None
