#coding: utf-8

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.db.models.signals import post_delete, post_save
from django.contrib.auth.signals import user_logged_in, user_logged_out

try:
    import pystatsd
except ImportError as ie:
    raise ImportError('Metrics collection is enabled, but we failed to '
                      'import "pystatsd": {0}'.format(unicode(ie)))

prefix = getattr(settings, 'METRICS_PREFIX', None)
host = getattr(settings, 'METRICS_HOST', 'localhost')
port = getattr(settings, 'METRICS_PORT', 8125)

statsd_client = pystatsd.Client(host, port, prefix=prefix)

def gauge_user_count():
    statsd_client.gauge('users.count', User.objects.count())

def gauge_active_users():
    statsd_client.gauge('users.active', Session.objects.count())

def logged_out(**kwargs):
    statsd_client.decr('users.active')

def logged_in(**kwargs):
    statsd_client.incr('users.active')

def user_deleted(**kwargs): 
    statsd_client.decr('users.count')    

def user_created(**kwargs):
    if not kwargs['instance'].id:
        statsd_client.incr('users.count')

def capture_users_metrics(statsd_client):
    gauge_user_count()
    gauge_active_users()

    if not getattr(User, '__metrics_registered', False):
        post_delete.connect(sender=User, receiver=user_deleted)
        post_save.connect(sender=User, receiver=user_created)

        user_logged_in.connect(receiver=logged_in)
        user_logged_out.connect(receiver=logged_out)

        User.__metrics_registered = True

capture_users_metrics(statsd_client)