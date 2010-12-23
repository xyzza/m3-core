#coding:utf-8

from django.core.management.base import BaseCommand, CommandError

from m3.contrib.task_schedule.api import execute_tasks

class Command(BaseCommand):
    def handle(self, *args, **options):
        execute_tasks()