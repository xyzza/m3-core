# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'RequestActivity.url'
        db.add_column('m3_usermon_requests', 'url', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True), keep_default=False)

        # Adding field 'UserActivity.user_name'
        db.add_column('m3_usermon_activity', 'user_name', self.gf('django.db.models.fields.CharField')(max_length=30, null=True, blank=True), keep_default=False)

        # Renaming column for 'UserActivity.user_id' to match new field type.
        db.rename_column('m3_usermon_activity', 'user_id_id', 'user_id')
        # Changing field 'UserActivity.user_id'
        db.alter_column('m3_usermon_activity', 'user_id', self.gf('django.db.models.fields.PositiveIntegerField')())

        # Removing index on 'useractivity', fields ['user_id']
        db.delete_index('m3_usermon_activity', ['user_id_id'])


    def backwards(self, orm):
        
        # Deleting field 'RequestActivity.url'
        db.delete_column('m3_usermon_requests', 'url')

        # Deleting field 'UserActivity.user_name'
        db.delete_column('m3_usermon_activity', 'user_name')

        # Renaming column for 'UserActivity.user_id' to match new field type.
        db.rename_column('m3_usermon_activity', 'user_id', 'user_id_id')
        # Changing field 'UserActivity.user_id'
        db.alter_column('m3_usermon_activity', 'user_id_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User']))

        # Adding index on 'useractivity', fields ['user_id']
        db.create_index('m3_usermon_activity', ['user_id_id'])


    models = {
        'usermon.requestactivity': {
            'Meta': {'object_name': 'RequestActivity', 'db_table': "'m3_usermon_requests'"},
            'a_avg_request_time': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'a_total_requests': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'avg_request_time': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'period': ('django.db.models.fields.DateTimeField', [], {}),
            'request_type': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'total_requests': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'})
        },
        'usermon.useractivity': {
            'Meta': {'object_name': 'UserActivity', 'db_table': "'m3_usermon_activity'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_request': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'user_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['usermon']
