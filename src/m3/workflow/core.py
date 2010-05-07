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

class Empty:
    pass

#============================================================================
#================== КЛАССЫ ГЕНЕРИРУЮЩИЕ СКРИПТ МОДЕЛЕЙ ======================
#============================================================================

class BaseModelGenerator:
    ''' Базовый класс для генерации скрипта модели '''
    metaclass = ''
    baseclass = ''
    class_suffix = ''
    table_suffix = ''
    attribute = ''
    TEMPLATE = '''
class %(classname)s(%(baseclass)s):
    __metaclass__ = %(metaclass)s
    class Meta:
        db_table = '%(db_table)s'
    class WorkflowMeta:
        workflow = %(class_name)s
    '''
    
    def __init__(self, workflow):
        self.workflow = workflow
    
    def get_class_name(self):
        ''' Функция возвращает название класса модели '''
        return self.workflow.__class__.__name__ + self.class_suffix
    
    def get_table_name(self):
        ''' Функция возвращает название таблицы модели '''
        return self.workflow.meta_dbtable() + self.table_suffix
    
    def get_script(self):
        ''' Возвращает готовый для исполнения скрипт модели '''
        all_params = {'class_name': self.workflow.__class__.__name__,
                      'metaclass' : self.metaclass,
                      'baseclass' : self.baseclass,
                      'classname' : self.get_class_name(),
                      'db_table'  : self.get_table_name()}
        result = self.TEMPLATE % all_params
        return result
    
    def get_register_script(self):
        ''' Регистрирует класс модели в  '''
        if self.attribute:
            # Строка типа: MyWorkflow.models.wf_model = MyWorkflowModel
            return self.workflow.__class__.__name__ + '.models.' + self.attribute + ' = ' + self.get_class_name()
        return '' 
        
    
class GeneratorWorkflow(BaseModelGenerator):
    metaclass = 'm3_workflow.MetaWorkflowModel'
    baseclass = 'm3_workflow.BaseWorkflowModel'
    class_suffix = 'Model'
    table_suffix = ''
    attribute = 'wf'
    
class GeneratorStep(BaseModelGenerator):
    metaclass = 'm3_workflow.MetaWorkflowStateModel'
    baseclass = 'm3_workflow.BaseWorkflowStepModel'
    class_suffix = 'StateModel'
    table_suffix = 'State'
    attribute = 'step'
    
class GeneratorChild(BaseModelGenerator):
    metaclass = 'm3_workflow.MetaWorkflowChildModel'
    baseclass = 'm3_workflow.BaseWorkflowChildModel'
    class_suffix = 'ChildModel'
    table_suffix = 'Child'
    attribute = 'child'
    
class GeneratorWSO(BaseModelGenerator):
    metaclass = 'm3_workflow.MetaWorkflowModel'
    baseclass = 'm3_workflow.BaseWorkflowModel'
    class_suffix = 'WSOModel'
    table_suffix = 'WSO'
    attribute = 'wso'
    
class GeneratorDoc(BaseModelGenerator):
    metaclass = 'm3_workflow.MetaWorkflowModel'
    baseclass = 'm3_workflow.BaseWorkflowModel'
    def get_class_name(self):
        return self.workflow.meta_dbtable() + 'DocModel'
    
    def get_script(self):
        ''' Отличие в том, что DOC таблиц может быть много и имена будут разные '''
        result = ''
        documents = getattr(self.workflow.Meta, 'documents', [])
        for doc in documents:
            # Не знаю пока что с этим делать. Пока нет реальных процессов путь отваливается.
            raise NotImplementedError()
            assert isinstance(doc, BaseWorkflowModel)
            result += self.TEMPLATE % \
                     {'class_name': self.__class__.__name__,
                      'db_table':   self.meta_dbtable() + doc.document_class.document_class,
                      'DocModel':   doc.document_class.__name__}
        return result
        
    def get_register_script(self):
        # Тут написать для доков
        return ''

#============================================================================
#=================== БАЗОВЫЙ КЛАСС РАБОЧЕГО ПРОЦЕССА ========================
#============================================================================
class Workflow(object):
    # Ассессор для моделей рабочего процесса
    models = Empty()
    
    def __init__(self, *args, **kwargs):
        self.start_step = WorkflowStartStep()
        self.end_step = WorkflowEndStep()
        self.steps=[]
        
        # Уникальный по системе идентификатор рабочего процесса.
        self.id = ''
        
        # Список классов генерирующих код для общего скрипта моделей процесса
        # Так было сделано для возможности перекрыть скрипт каждой отдельной таблицы в потомках
        self._model_generators = [GeneratorWorkflow,
                                  GeneratorStep,
                                  GeneratorChild,
                                  GeneratorWSO,
                                  GeneratorDoc]
    
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
    
    
    @classmethod
    def create_workflow_models(cls):
        ''' Возвращает полный, готовый для выполнения скрипт, генерирующий все модели процесса '''
        model_script = '''
from m3 import workflow as m3_workflow
import %(workflow_module)s
        '''
        model_script = model_script % {'workflow_module': cls.__module__}
        wf = cls()
        
        # Зная имя класса каждой модели можно сразу присвоить их models
        register_script = '# Assessors \n'
        
        for gen_class in wf._model_generators:
            gen_ins = gen_class(wf)
            model_script += '\n' + gen_ins.get_script()
            register_script += gen_ins.get_register_script() + '\n'
            
        model_script += '\n' # Чтобы в последней строке не было syntax error
        
        return model_script + register_script
    
#============================================================================
#=================== БАЗОВЫЕ КЛАССЫ МОДЕЛЕЙ ПРОЦЕССА ========================
#============================================================================
class BaseWorkflowModel(models.Model):
    ''' Базовый класс для хранимых моделей рабочих потоков '''
    class Meta:
        abstract = True

class BaseWorkflowChildModel(models.Model):
    ''' Базовый класс для хранимых моделей рабочих потоков '''
    class Meta:
        abstract = True

class BaseWorkflowStepModel(models.Model):
    ''' Базовый класс для хранимых моделей шагов рабочих процессов '''
    class Meta:
        abstract = True
        
class BaseWorkflowWSOModel(models.Model):
    class Meta:
        abstract = True

class BaseWorkflowDocModel(models.Model):
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
