#coding:utf-8

import unittest

from django.test.utils import setup_test_environment, teardown_test_environment
from django.test.testcases import OutputChecker, DocTestRunner, TestCase
from django.db.models import get_app, get_apps
from django.conf import settings

import helpers

TEST_MODULE = 'tests'
TEST_SEP = '@' # Vadim


def runner(test_labels, verbosity=1, interactive=True, extra_tests=[]):
    """
    Run the unit tests for all the test labels in the provided list.
    Labels must be of the form:
     - app.TestClass.test_method
        Run a single specific test method
     - app.TestClass
        Run all the test methods in a given class
     - app
        Search for doctests and unittests in the named application.

    When looking for tests, the test runner will look in the models and
    tests modules for the application.

    A list of 'extra' tests may also be provided; these tests
    will be added to the test suite.

    Returns the number of tests that failed.
    """
    setup_test_environment()

    settings.DEBUG = False
    suite = unittest.TestSuite()

    if test_labels:
        for label in test_labels:
            # if '.' in label:
            if TEST_SEP in label:
                suite.addTest(helpers.build_test(label))
            else:
                # app = get_app_M3(label)
                app = helpers.get_app_M3(get_app.im_self, label)
                suite.addTest(helpers.build_suite(app))
    else:
        # Приложения без модели не загружаются! Нужно загружать, но get_apps() мы не можем менять
        # for app in get_apps():
        for app in helpers.get_apps_M3(get_apps.im_self):
            suite.addTest(helpers.build_suite(app))

    for test in extra_tests:
        suite.addTest(test)

    suite = helpers.reorder_suite(suite, (TestCase,))

    old_name = settings.DATABASE_NAME
    from django.db import connection
    connection.creation.create_test_db(verbosity, autoclobber=not interactive)
    result = unittest.TextTestRunner(verbosity=verbosity).run(suite)
    connection.creation.destroy_test_db(old_name, verbosity)

    teardown_test_environment()

    return len(result.failures) + len(result.errors)

