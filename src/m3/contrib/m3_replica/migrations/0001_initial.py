# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'SyncPoint'
        db.create_table('m3_replica_sync_points', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('sync_type', self.gf('django.db.models.fields.SmallIntegerField')(default=0, null=True, blank=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')()),
            ('subject', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=200, null=True, blank=True)),
        ))
        db.send_create_signal('m3_replica', ['SyncPoint'])

        # Adding model 'ImportedObject'
        db.create_table('m3_replica_imported_objects', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('model', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=200, null=True, blank=True)),
            ('ikey', self.gf('django.db.models.fields.PositiveIntegerField')(default=0, db_index=True)),
            ('ifullkey', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=200, null=True, blank=True)),
            ('ekey', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('was_created', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('sync_point', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_replica.SyncPoint'], null=True, blank=True)),
        ))
        db.send_create_signal('m3_replica', ['ImportedObject'])


    def backwards(self, orm):
        
        # Deleting model 'SyncPoint'
        db.delete_table('m3_replica_sync_points')

        # Deleting model 'ImportedObject'
        db.delete_table('m3_replica_imported_objects')


    models = {
        'm3_replica.importedobject': {
            'Meta': {'object_name': 'ImportedObject', 'db_table': "'m3_replica_imported_objects'"},
            'ekey': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
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
