# -*- coding: utf-8 -*-
'''
Доработанная версия /django/test/simple.py вызываемая из команды test по умолчанию.
Доработка заключается в поддержке вложенных приложений и приложений без модели.
Чтобы задействовать модуль пропишите settings.TEST_RUNNER = 'm3.contrib.tests.M3TestSuiteRunner'
'''

import unittest

from django.db.models.loading import AppCache
from django.conf import settings
from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured
from django.test.simple import DjangoTestSuiteRunner, build_test, build_suite, reorder_suite
from django.test.testcases import TestCase
from django.utils.module_loading import module_has_submodule


class TestAppCache(AppCache):
    """ Добавлена поддержка приложений без моделей """
    
    def __init__(self):
        super(TestAppCache, self).__init__()
        self._without_models = []
    
    def get_apps_without_models(self):
        """ Возвращает список загруженных приложений без моделей """
        return self._without_models
    
    def get_app(self, app_label, emptyOK=False):
        """ Почти полная копипаста оригинального метода """
        self._populate()
        self.write_lock.acquire()
        try:
            for app_name in settings.INSTALLED_APPS:
                if app_label == app_name.split('.')[-1]:
                    mod = self.load_app(app_name, False)
                    # Если в приложении нет модели, то подсунем init
                    if mod is None:
                        mod = import_module('.__init__', app_label)
                    return mod
                    
            raise ImproperlyConfigured("App with label %s could not be found" % app_label)
        finally:
            self.write_lock.release()
            
    def load_app(self, app_name, can_postpone=False):
        """ Почти полная копипаста оригинального метода """
        self.handled[app_name] = None
        self.nesting_level += 1
        app_module = import_module(app_name)

        try:
            models = import_module('.models', app_name)
        except ImportError:
            self.nesting_level -= 1
            # If the app doesn't have a models module, we can just ignore the
            # ImportError and return no models for it.
            if not module_has_submodule(app_module, 'models'):
                app = import_module('.__init__', app_name)
                self._without_models.append(app)
                return
            # But if the app does have a models module, we need to figure out
            # whether to suppress or propagate the error. If can_postpone is
            # True then it may be that the package is still being imported by
            # Python and the models module isn't available yet. So we add the
            # app to the postponed list and we'll try it again after all the
            # recursion has finished (in populate). If can_postpone is False
            # then it's time to raise the ImportError.
            else:
                if can_postpone:
                    self.postponed.append(app_name)
                    return None
                else:
                    raise

        self.nesting_level -= 1
        if models not in self.app_store:
            self.app_store[models] = len(self.app_store)
        return models

class M3TestSuiteRunner(DjangoTestSuiteRunner):

    def build_suite(self, test_labels, extra_tests=None, **kwargs):
        """ Почти полная копипаста оригинального метода """
        suite = unittest.TestSuite()
        app_cache = TestAppCache()

        if test_labels:
            for label in test_labels:
                if '.' in label:
                    suite.addTest(build_test(label))
                else:
                    app = app_cache.get_app(label)
                    suite.addTest(build_suite(app))
        else:
            for app in app_cache.get_apps():
                if str(app).startswith("<module 'django.contrib."):
                    continue
                suite.addTest(build_suite(app))
                
            for app in app_cache.get_apps_without_models():
                suite.addTest(build_suite(app))

        if extra_tests:
            for test in extra_tests:
                suite.addTest(test)

        return reorder_suite(suite, (TestCase,))

