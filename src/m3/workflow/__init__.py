#coding:utf-8

'''
Подсистема обслуживания рабочих процессов
Платформы М3
'''

from loading import get_workflow
from django.db import models

# Эти импорты нужны для работы сгенерированного через exec кода
from meta import WorkflowModelBase, WorkflowStateModelBase,\
                 WorkflowChildModelBase, WorkflowWSOModelBase, WorkflowDocModelBase


from core import Workflow, WorkflowStep, WorkflowModel, WorkflowStepModel, WorkflowWSOModel,\
                 WorkflowDocModel
                 
from relations import WorkflowNamedDocsModelBase