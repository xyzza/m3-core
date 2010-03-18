#coding:utf-8
'''
Модуль с метаклассами подсистемы рабочиъх процессов

Created on 10.03.2010

@author: akvarats
'''

from django.db import models
from django.db.models.base import ModelBase
from m3.workflow.exceptions import ImproperlyConfigured
from m3.workflow.core import WorkflowWSObject

#===============================================================================
# Метакласс для моделей рабочих процессов
#===============================================================================
class WorkflowModelBase(ModelBase):
    '''
    Базовый метакласс для моделей рабочих потока.
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowModelBase, cls).__new__(cls, name, bases, attrs)
        
        # created - серверные дата/время создания объекта рабочего потока
        models.DateTimeField(auto_now_add = True).contribute_to_class(klass, 'created')
        
        # modified - серверные дата/время модификации экземпляра рабочего потока (именно текущей записи WorkflowModel)
        models.DateTimeField(auto_now = True).contribute_to_class(klass, 'modified')
        
        # state - шаг, на котором находится текущий экземпляр рабочего процесса.
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'StateModel').contribute_to_class(klass, 'state')
        
        # parent_workflow_code - код родительского рабочего потока
        models.CharField(max_length = 100).contribute_to_class(klass, 'parent_workflow_code')
        
        # parent_workflow_id - идентификатор экземпляра родительского рабочего потока
        models.PositiveIntegerField().contribute_to_class(klass, 'parent_workflow_id')
        
        return klass


class WorkflowStateModelBase(ModelBase):
    '''
    Базовый метакласс для моделей хранимых шагов рабочего процесса
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowStateModelBase, cls).__new__(cls, name, bases, attrs)
        
        # workflow - ссылка на соответствующий WorkflowModel - 
        # ссылка на экземпляр соответствующего рабочего потока
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')
        
        # step - текущий шаг рабочего процесса
        models.CharField(max_length = 100).contribute_to_class(klass, 'step')
        
        # prev_step - предыдущий шаг рабочего процесса.
        # Может быть пустым, так как начальный шаг не имеет предыдущего шага
        models.CharField(max_length = 100, null = True, blank = True).contribute_to_class(klass, 'from_step')
        
        return klass
    

class WorkflowChildModelBase(ModelBase):
    '''
    Базовый метакласс для модели хранения ссылок на экземпляры дочерних рабочих процессов,
    которые были порождены из текущего процесса
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowChildModelBase, cls).__new__(cls, name, bases, attrs)
        
        # workflow - ссылка на соответствующий рабочий процесс
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')
        
        # child_workflow_code - код дочернего рабочего потока
        models.CharField(max_length = 100).contribute_to_class(klass, 'child_workflow_code')
        
        # child_workflow_id - идентификатор экземпляра порожденного рабочего потока
        models.PositiveIntegerField().contribute_to_class(klass, 'child_workflow_id')
        
        
class WorkflowWSOModelBase(ModelBase):
    '''
    Базовый метакласс для модели хранения ссылок на порожденные процессы
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowWSOModelBase, cls).__new__(cls, name, bases, attrs)
        
        # workflow - ссылка на соответствующий рабочий процесс
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')
        
        # Создаем ссылки на все объекты указанные в Meta нашего процесса
        ws_objects = getattr(klass.WorkflowMeta.workflow.Meta, 'ws_objects', [])
        if not isinstance(ws_objects, (list, tuple)):
            raise ImproperlyConfigured('Attribute "ws_objects" in workflow Meta must be a list or tuple')
        for obj in ws_objects:
            if isinstance(obj, WorkflowWSObject):
                model_type, field_name = obj.wso_class, obj.wso_field
            elif isinstance(obj, tuple):
                model_type, field_name = obj
            else:
                raise ImproperlyConfigured('Item of "ws_objects" must be a instance of WorkflowWSObject or tuple')

            models.ForeignKey(model_type).contribute_to_class(klass, field_name)
        
    
#===============================================================================
# Создание классов для моделей рабочих процессов
#===============================================================================

def create_workflow_models(workflow_class):
    '''
    Генерация текста исходного кода для экземпляров моделей рабочего процесса и его шагов 
    '''
    
    FINAL_TEMPLATE = '''
from m3 import workflow as m3_workflow
import %(workflow_module)s
%(workflow_model)s
%(workflow_step_model)s
%(workflow_child_model)s
%(workflow_wso_model)s
'''
    WORKFLOW_MODEL_TEMPLATE = '''
class %(class_name)sModel(m3_workflow.WorkflowModel):
    __metaclass__ = m3_workflow.WorkflowModelBase
    class Meta:
        db_table = '%(db_table)s'
    class WorkflowMeta:
        workflow = %(class_name)s
'''
    WORKFLOW_STEP_MODEL_TEMPLATE = '''
class %(class_name)sStateModel(m3_workflow.WorkflowStepModel):
    __metaclass__ = m3_workflow.WorkflowStateModelBase
    class Meta:
        db_table = '%(db_table)sSteps'
    class WorkflowMeta:
        workflow = %(class_name)s
'''
    WORKFLOW_CHILD_MODEL_TEMPLATE = '''
class %(class_name)sChildModel(m3_workflow.WorkflowStepModel):
    __metaclass__ = m3_workflow.WorkflowChildModelBase
    class Meta:
        db_table = '%(db_table)sChild'
    class WorkflowMeta:
        workflow = %(class_name)s
'''
    WORKFLOW_WSO_MODEL_TEMPLATE = '''
class %(class_name)sWSOModel(m3_workflow.WorkflowWSOModel):
    __metaclass__ = m3_workflow.WorkflowWSOModelBase
    class Meta:
        db_table = '%(db_table)sWSO'
    class WorkflowMeta:
        workflow = %(class_name)s
'''
    WORKFLOW_DOC_MODEL_TEMPLATE = '''
class 
'''

    params = {'class_name': workflow_class.__name__,
              'db_table': workflow_class.meta_dbtable(),
              'full_class_name': workflow_class.meta_full_class_name()}

    model_text       = WORKFLOW_MODEL_TEMPLATE % params
    step_model_text  = WORKFLOW_STEP_MODEL_TEMPLATE % params
    child_model_text = WORKFLOW_CHILD_MODEL_TEMPLATE % params
    wso_model_text   = WORKFLOW_WSO_MODEL_TEMPLATE % params
    
    # Модели процесса которые есть всегда
    result = FINAL_TEMPLATE % {'workflow_module': workflow_class.__module__,
                               'workflow_model': model_text,
                               'workflow_step_model': step_model_text,
                               'workflow_child_model': child_model_text,
                               'workflow_wso_model': wso_model_text}
    
    # Модели которых может быть сколько угодно много
    
    
    return result