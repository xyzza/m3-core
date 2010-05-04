#coding:utf-8
'''
Модуль с метаклассами подсистемы рабочих процессов
Created on 10.03.2010
@author: akvarats
'''

from django.db import models
from django.db.models.base import ModelBase
from m3.workflow.exceptions import ImproperlyConfigured
from m3.workflow.core import WorkflowWSObject, WorkflowDocument

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
        
class WorkflowDocModelBase(ModelBase):
    def __new__(cls, name, bases, attrs):
        klass = super(WorkflowDocModelBase, cls).__new__(cls, name, bases, attrs)
        
        # workflow - ссылка на соответствующий рабочий процесс
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'Model').contribute_to_class(klass, 'workflow')
        
        #+workflow_state : ForeignKey(MyWorkflowStateModel)
        models.ForeignKey(klass.WorkflowMeta.workflow.meta_class_name() + 'StateModel').contribute_to_class(klass, 'workflow_state')
        
        # created - серверные дата/время создания документа рабочего потока
        models.DateTimeField(auto_now_add = True).contribute_to_class(klass, 'created')
