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
    Базовый класс для всех метаклассов хранимых моделей рабочих потока.
    
    Добавляет в модель рабочего потока следующие поля:
        * version: integer - версия класса рабочего потока;
        * step: string - идентификатор текущего шага потока;
        * created: datetime - серверные дата и время создания экземпляра 
                              рабочего потока;
        * modified: datetime - серверные дата и время последнего изменения
                               экземпляра рабочего потока (имеется ввиду,
                               именно экземпляра модели рабочего потока)
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowModelBase, cls).__new__(cls, name, bases, attrs)
        
        models.IntegerField().contribute_to_class(klass, 'version')
        models.CharField(max_length=100).contribute_to_class(klass, 'step')
        models.DateTimeField(auto_now_add=True).contribute_to_class(klass, 'created')
        models.DateTimeField(auto_now=True).contribute_to_class(klass, 'modified')
        
        return klass

class WorkflowStepModelBase(ModelBase):
    '''
    Базовый метакласс для моделей хранимых шагов рабочего процесса
    '''
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowStepModelBase, cls).__new__(cls, name, bases, attrs)
        
        # ссылка на объект рабочего процесса
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name()+'Model').contribute_to_class(klass, 'workflow')
        # текущий шаг рабочего процесса
        models.CharField(max_length=100).contribute_to_class(klass, 'step')
        # предыдущий шаг рабочего процесса. может быть пустым, так как
        # начальный шаг не имеет предыдущего шага
        models.CharField(max_length=100, null=True, blank=True).contribute_to_class(klass, 'from_step')
        
        return klass
                
#===============================================================================
# Метакласс для моделей связок workflow и объектов
#===============================================================================


#===============================================================================
# Создание классов для моделей рабочих процессов
#===============================================================================

def create_workflow_models(workflow_class, model_meta = None, step_model_meta = None):
    '''
    Генерация текста исходного кода для экземпляров моделей рабочего процесса и его шагов 
    '''
    
    FINAL_TEMPLATE = '''
from m3 import workflow as m3_workflow
import %(workflow_module)s
%(workflow_model)s
%(workflow_step_model)s
'''
    WORKFLOW_MODEL_TEMPLATE = '''
class %(class_name)sModel(m3_workflow.WorkflowModel):
    %(meta_class)s
    class Meta:
        db_table = '%(db_table)s'
    class WorkflowMeta:
        workflow = %(full_class_name)s
'''
    WORKFLOW_STEP_MODEL_TEMPLATE = '''
class %(class_name)sStepModel(m3_workflow.WorkflowStepModel):
    %(meta_class)s
    class Meta:
        db_table = '%(db_table)sSteps'
    class WorkflowMeta:
        workflow = %(full_class_name)s
'''
    model_text = WORKFLOW_MODEL_TEMPLATE % {'class_name': workflow_class.__name__,
                                            'meta_class': '__metaclass__ = ' + model_meta.__name__ if model_meta else '__metaclass__ = m3_workflow.WorkflowModelBase',
                                            'db_table': workflow_class.meta_dbtable(),
                                            'full_class_name': workflow_class.meta_full_class_name()}
    
    step_model_text = WORKFLOW_STEP_MODEL_TEMPLATE % {'class_name': workflow_class.__name__,
                                                      'meta_class': '__metaclass__ = ' + step_model_meta.__name__ if step_model_meta else '__metaclass__ = m3_workflow.WorkflowStepModelBase',
                                                      'db_table': workflow_class.meta_dbtable(),
                                                      'full_class_name': workflow_class.meta_full_class_name()}
    return FINAL_TEMPLATE % {'workflow_module': workflow_class.__module__,
                             'workflow_model': model_text,
                             'workflow_step_model': step_model_text}