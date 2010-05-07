#coding:utf-8

'''
Подсистема обслуживания рабочих процессов
Платформы М3
'''

from loading import get_workflow
from django.db import models

# Эти импорты нужны для работы сгенерированного через exec кода
from meta import MetaWorkflowModel, MetaWorkflowStateModel, MetaWorkflowChildModel, \
                 MetaWorkflowWSOModel, MetaWorkflowDocModel

from core import Workflow, WorkflowStep, BaseWorkflowChildModel, BaseWorkflowModel, BaseWorkflowStepModel, \
                 BaseWorkflowWSOModel, BaseWorkflowDocModel
                 
from relations import MetaNamedDocsModel, MetaRelationModel