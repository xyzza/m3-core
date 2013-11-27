# -*- coding: utf-8 -*-

import time
import hashlib


DEFAULT_STATSD_HOST = 'localhost'
DEFAULT_STATSD_PORT = 8125


def create_statsd_client(settings):
    if getattr(settings, 'ENABLE_METRICS_COLLECTION', False):
        return StatsdClient(settings)
    else:
        return FakeStatsdClient()


class TimingManager(object):

    def __init__(self, client, url):
        self._client = client
        self._url = url

    def __enter__(self):
        self.time = time.time()
        return self

    def __exit__(self, ex, ex_cls, tb):
        self._client.process(self._url, self.time)
        return ex is None


class StatsdClient(object):

    def __init__(self, settings):
        try:
            import pystatsd
        except ImportError as ie:
            raise ImportError(
                'Metrics collection is enabled, but we failed to '
                'import "pystatsd": {0}'.format(unicode(ie))
            )
        prefix = getattr(settings, 'METRICS_PREFIX', None)
        host = getattr(settings, 'METRICS_HOST', DEFAULT_STATSD_HOST)
        port = getattr(settings, 'METRICS_PORT', DEFAULT_STATSD_PORT)
        self._client = pystatsd.Client(host, port, prefix=prefix)

    def __call__(self, url):
        return TimingManager(self, url)

    def process(self, url, time):
        md5 = hashlib.md5()
        md5.update(url)
        url_hash = md5.hexdigest()
        self._client.incr('controller_{0}.requests.count'.format(url_hash))
        self._client.incr('requests.total')
        self._client.timing_since(
            'controller_{0}.requests.timing'.format(url_hash), time)


class FakeStatsdClient(object):

    def __call__(self, url):
        return TimingManager(self, url)

    def process(self, *args, **kwargs):
        pass
