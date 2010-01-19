# -*- coding: utf-8 -*-
'''
Доработанная версия /django/test/simple.py вызываемая из команды test по умолчанию.
Доработка заключается в поддержке вложенных приложений и приложений без модели.
Чтобы задействовать модуль пропишите settings.TEST_RUNNER
Введен специальный синтаксис аргументов и изменен исходный:
1. test без аргументов - запуск тестов всех приложений указанных в INSTALLED_APPS проекта
2. test app2 app3 app1.inner_app2.inner_app3 и т.д. - тест конкретных указанных приложений
   с путями разделенными пробелом 
3. test app2@TestClass - запуск теста приложения из заданного класса
4. test app3@TestClass@testMethod - запуск теста приложения из заданного класса и метода
'''

from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured

import unittest
from django.conf import settings
from django.db.models import get_app, get_apps
from django.test import _doctest as doctest
from django.test.utils import setup_test_environment, teardown_test_environment
from django.test.testcases import OutputChecker, DocTestRunner, TestCase

# The module name for tests outside models.py
TEST_MODULE = 'tests'
TEST_SEP = '@' # Vadim

doctestOutputChecker = OutputChecker()

def get_tests(app_module):
    try:
        app_path = app_module.__name__.split('.')[:-1]
        test_module = __import__('.'.join(app_path + [TEST_MODULE]), {}, {}, TEST_MODULE)
    except ImportError, e:
        # Couldn't import tests.py. Was it due to a missing file, or
        # due to an import error in a tests.py that actually exists?
        import os.path
        from imp import find_module
        try:
            mod = find_module(TEST_MODULE, [os.path.dirname(app_module.__file__)])
        except ImportError:
            # 'tests' module doesn't exist. Move on.
            test_module = None
        else:
            # The module exists, so there must be an import error in the
            # test module itself. We don't need the module; so if the
            # module was a single file module (i.e., tests.py), close the file
            # handle returned by find_module. Otherwise, the test module
            # is a directory, and there is nothing to close.
            if mod[0]:
                mod[0].close()
            raise
    return test_module

def build_suite(app_module):
    "Create a complete Django test suite for the provided application module"
    suite = unittest.TestSuite()

    # Load unit and doctests in the models.py module. If module has
    # a suite() method, use it. Otherwise build the test suite ourselves.
    if hasattr(app_module, 'suite'):
        suite.addTest(app_module.suite())
    else:
        suite.addTest(unittest.defaultTestLoader.loadTestsFromModule(app_module))
        try:
            suite.addTest(doctest.DocTestSuite(app_module,
                                               checker=doctestOutputChecker,
                                               runner=DocTestRunner))
        except ValueError:
            # No doc tests in models.py
            pass

    # Check to see if a separate 'tests' module exists parallel to the
    # models module
    test_module = get_tests(app_module)
    if test_module:
        # Load unit and doctests in the tests.py module. If module has
        # a suite() method, use it. Otherwise build the test suite ourselves.
        if hasattr(test_module, 'suite'):
            suite.addTest(test_module.suite())
        else:
            suite.addTest(unittest.defaultTestLoader.loadTestsFromModule(test_module))
            try:
                suite.addTest(doctest.DocTestSuite(test_module,
                                                   checker=doctestOutputChecker,
                                                   runner=DocTestRunner))
            except ValueError:
                # No doc tests in tests.py
                pass
    return suite

def build_test(label):
    """Construct a test case a test with the specified label. Label should
    be of the form model.TestClass or model.TestClass.test_method. Returns
    an instantiated test or test suite corresponding to the label provided.

    """
    # parts = label.split('.')
    parts = label.split(TEST_SEP)
    if len(parts) < 2 or len(parts) > 3:
        raise ValueError("Test label '%s' should be of the form app.TestCase or app.TestCase.test_method" % label)

    # app_module = get_app(parts[0])
    app_module = get_app_M3(get_app.im_self, parts[0])
    TestClass = getattr(app_module, parts[1], None)

    # Couldn't find the test class in models.py; look in tests.py
    if TestClass is None:
        test_module = get_tests(app_module)
        if test_module:
            TestClass = getattr(test_module, parts[1], None)

    if len(parts) == 2: # label is app.TestClass
        try:
            return unittest.TestLoader().loadTestsFromTestCase(TestClass)
        except TypeError:
            raise ValueError("Test label '%s' does not refer to a test class" % label)
    else: # label is app.TestClass.test_method
        if not TestClass:
            raise ValueError("Test label '%s' does not refer to a test class" % label)
        return TestClass(parts[2])

# Python 2.3 compatibility: TestSuites were made iterable in 2.4.
# We need to iterate over them, so we add the missing method when
# necessary.
try:
    getattr(unittest.TestSuite, '__iter__')
except AttributeError:
    setattr(unittest.TestSuite, '__iter__', lambda s: iter(s._tests))

def partition_suite(suite, classes, bins):
    """
    Partitions a test suite by test type.

    classes is a sequence of types
    bins is a sequence of TestSuites, one more than classes

    Tests of type classes[i] are added to bins[i],
    tests with no match found in classes are place in bins[-1]
    """
    for test in suite:
        if isinstance(test, unittest.TestSuite):
            partition_suite(test, classes, bins)
        else:
            for i in range(len(classes)):
                if isinstance(test, classes[i]):
                    bins[i].addTest(test)
                    break
            else:
                bins[-1].addTest(test)

def reorder_suite(suite, classes):
    """
    Reorders a test suite by test type.

    classes is a sequence of types

    All tests of type clases[0] are placed first, then tests of type classes[1], etc.
    Tests with no match in classes are placed last.
    """
    class_count = len(classes)
    bins = [unittest.TestSuite() for i in range(class_count+1)]
    partition_suite(suite, classes, bins)
    for i in range(class_count):
        bins[0].addTests(bins[i+1])
    return bins[0]

#====================== Нужно использовать собственный get_app ========================
def get_app_M3(self, app_label):
    """
    Returns the module containing the models for the given app_label. If
    the app has no models in it and 'emptyOK' is True, returns None.
    """
    self._populate()
    self.write_lock.acquire()
    try:
        # Соответствие приложения теперь ищется полностью, т.к. точка не отвечает за тестирование
        if app_label in settings.INSTALLED_APPS:
            mod = self.load_app(app_label, False)
            if mod is None:
                print '!!! No model found for', app_label, 'use __init__'
                try:
                    mod = import_module('.__init__', app_label)
                    return mod
                except ImportError:
                    pass
            else:
                return mod
                
        raise ImproperlyConfigured, "App with label %s could not be found" % app_label
    finally:
        self.write_lock.release()

#===================== Нужно использовать собственный get_apps ========================
def get_apps_M3(self):
    "Returns a list of all installed modules that contain models."
    # Тут мы имеет загруженные в self.app_store модели
    self._populate()
    # В self.postponed будут не загруженные приложения. Пробуем загрузить из init
    for app in self.postponed:
        init = import_module('.__init__', app)
        self.app_store[init] = len(self.app_store)
    
    # Ensure the returned list is always in the same order (with new apps
    # added at the end). This avoids unstable ordering on the admin app
    # list page, for example.
    apps = [(v, k) for k, v in self.app_store.items()]
    apps.sort()
    return [elt[1] for elt in apps]
