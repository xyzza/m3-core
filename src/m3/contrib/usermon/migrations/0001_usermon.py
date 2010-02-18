#coding:utf-8

from south.db import db
from django.db import models
from m3.contrib.usermon.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding model 'RequestActivity'
        db.create_table('m3_usermon_requests', (
            ('id', orm['usermon.RequestActivity:id']),
            ('period', orm['usermon.RequestActivity:period']),
            ('avg_request_time', orm['usermon.RequestActivity:avg_request_time']),
            ('total_requests', orm['usermon.RequestActivity:total_requests']),
            ('a_avg_request_time', orm['usermon.RequestActivity:a_avg_request_time']),
            ('a_total_requests', orm['usermon.RequestActivity:a_total_requests']),
            ('request_type', orm['usermon.RequestActivity:request_type']),
        ))
        db.send_create_signal('usermon', ['RequestActivity'])
        
        # Adding model 'UserActivity'
        db.create_table('m3_usermon_activity', (
            ('id', orm['usermon.UserActivity:id']),
            ('user_id', orm['usermon.UserActivity:user_id']),
            ('last_request', orm['usermon.UserActivity:last_request']),
        ))
        db.send_create_signal('usermon', ['UserActivity'])
        
    
    
    def backwards(self, orm):
        
        # Deleting model 'RequestActivity'
        db.delete_table('m3_usermon_requests')
        
        # Deleting model 'UserActivity'
        db.delete_table('m3_usermon_activity')
        
    
    
    models = {
        'auth.group': {
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'unique_together': "(('content_type', 'codename'),)"},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'unique_together': "(('app_label', 'model'),)", 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'usermon.requestactivity': {
            'Meta': {'db_table': "'m3_usermon_requests'"},
            'a_avg_request_time': ('django.db.models.fields.IntegerField', [], {}),
            'a_total_requests': ('django.db.models.fields.IntegerField', [], {}),
            'avg_request_time': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'period': ('django.db.models.fields.DateTimeField', [], {}),
            'request_type': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'total_requests': ('django.db.models.fields.IntegerField', [], {})
        },
        'usermon.useractivity': {
            'Meta': {'db_table': "'m3_usermon_activity'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_request': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        }
    }
    
    complete_apps = ['usermon']
