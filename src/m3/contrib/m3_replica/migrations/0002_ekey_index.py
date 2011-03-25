# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding index on 'ImportedObject', fields ['ekey']
        db.create_index('m3_replica_imported_objects', ['ekey'])


    def backwards(self, orm):
        
        # Removing index on 'ImportedObject', fields ['ekey']
        db.delete_index('m3_replica_imported_objects', ['ekey'])


    models = {
        'm3_replica.importedobject': {
            'Meta': {'object_name': 'ImportedObject', 'db_table': "'m3_replica_imported_objects'"},
            'ekey': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ifullkey': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'ikey': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'sync_point': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_replica.SyncPoint']", 'null': 'True', 'blank': 'True'}),
            'was_created': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'm3_replica.syncpoint': {
            'Meta': {'object_name': 'SyncPoint', 'db_table': "'m3_replica_sync_points'"},
            'created': ('django.db.models.fields.DateTimeField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'subject': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'sync_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['m3_replica']
