#coding:utf-8
'''
Модуль с метаклассами подсистемы рабочиъх процессов

Created on 10.03.2010

@author: akvarats
'''

from django.db import models
from django.db.models.base import ModelBase

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
    Базовый метакласс для модели хранения ссылок на порожденные процессы
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowChildModelBase, cls).__new__(cls, name, bases, attrs)
        
        # workflow - ссылка на соответствующий рабочий процесс
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')
        
        # child_workflow_code - код дочернего рабочего потока
        models.CharField(max_length = 100).contribute_to_class(klass, 'child_workflow_code')
        
        # child_workflow_id - идентификатор экземпляра порожденного рабочего потока
        models.PositiveIntegerField().contribute_to_class(klass, 'child_workflow_id')
                
#===============================================================================
# Метакласс для моделей связок workflow и объектов
#===============================================================================


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

    model_text = WORKFLOW_MODEL_TEMPLATE % {'class_name': workflow_class.__name__,
                                            'db_table': workflow_class.meta_dbtable(),
                                            'full_class_name': workflow_class.meta_full_class_name()}
    
    step_model_text = WORKFLOW_STEP_MODEL_TEMPLATE % {'class_name': workflow_class.__name__,
                                                      'db_table': workflow_class.meta_dbtable(),
                                                      'full_class_name': workflow_class.meta_full_class_name()}
    
    child_model_text = WORKFLOW_CHILD_MODEL_TEMPLATE % {'class_name': workflow_class.__name__,
                                                      'db_table': workflow_class.meta_dbtable(),
                                                      'full_class_name': workflow_class.meta_full_class_name()}
    
    return FINAL_TEMPLATE % {'workflow_module': workflow_class.__module__,
                             'workflow_model': model_text,
                             'workflow_step_model': step_model_text,
                             'workflow_child_model': child_model_text}