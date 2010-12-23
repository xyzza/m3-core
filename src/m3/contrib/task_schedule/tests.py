#coding:utf-8

from datetime import datetime

from django.test import TestCase

from api import *
from models import *

class TestTaskSchedule(TestCase):
    
    def test_1(self):
        register_task('tst', 
                      simpel_proc, 
                      next_run=datetime.now(), 
                      period=periods.WEEKLY)
        task = Tasks.objects.get(task_name='tst')
        execute_tasks()
        task = Tasks.objects.get(task_name='tst')
        self.assertTrue(task.next_run > datetime.now() + timedelta(6))
        
        self.assertFalse(task.executing)
        self.assertEqual(task.status, StatusTypeEnum.OK)
        remove_task('tst')
        self.assertFalse(Tasks.objects.filter(task_name='tst').exists())

def simpel_proc():
    return 'test msg'