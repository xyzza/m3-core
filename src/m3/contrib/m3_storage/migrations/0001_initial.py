# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'StorageConfigurationModel'
        db.create_table('m3storage_configs', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300, blank=True)),
            ('version', self.gf('django.db.models.fields.PositiveIntegerField')()),
            ('active', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('m3_storage', ['StorageConfigurationModel'])

        # Adding model 'StorageTableModel'
        db.create_table('m3storage_tables', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('configuration', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_storage.StorageConfigurationModel'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30, db_index=True)),
            ('verbose_name', self.gf('django.db.models.fields.CharField')(max_length=200, blank=True)),
            ('comment', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('m3_storage', ['StorageTableModel'])

        # Adding model 'TableFieldModel'
        db.create_table('m3storage_fields', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('table', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_storage.StorageTableModel'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50, db_index=True)),
            ('type', self.gf('django.db.models.fields.SmallIntegerField')()),
            ('indexed', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('allow_blank', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('size', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('size_secondary', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('attributes', self.gf('django.db.models.fields.CharField')(max_length=300, blank=True)),
        ))
        db.send_create_signal('m3_storage', ['TableFieldModel'])

        # Adding model 'TableRelationModel'
        db.create_table('m3storage_relations', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('configuration', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_storage.StorageConfigurationModel'])),
            ('left_table', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
            ('right_table', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
            ('type', self.gf('django.db.models.fields.SmallIntegerField')()),
            ('left_key', self.gf('django.db.models.fields.CharField')(max_length=300, blank=True)),
            ('right_key', self.gf('django.db.models.fields.CharField')(max_length=300, blank=True)),
        ))
        db.send_create_signal('m3_storage', ['TableRelationModel'])


    def backwards(self, orm):
        
        # Deleting model 'StorageConfigurationModel'
        db.delete_table('m3storage_configs')

        # Deleting model 'StorageTableModel'
        db.delete_table('m3storage_tables')

        # Deleting model 'TableFieldModel'
        db.delete_table('m3storage_fields')

        # Deleting model 'TableRelationModel'
        db.delete_table('m3storage_relations')


    models = {
        'm3_storage.storageconfigurationmodel': {
            'Meta': {'object_name': 'StorageConfigurationModel', 'db_table': "'m3storage_configs'"},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300', 'blank': 'True'}),
            'version': ('django.db.models.fields.PositiveIntegerField', [], {})
        },
        'm3_storage.storagetablemodel': {
            'Meta': {'object_name': 'StorageTableModel', 'db_table': "'m3storage_tables'"},
            'comment': ('django.db.models.fields.TextField', [], {}),
            'configuration': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_storage.StorageConfigurationModel']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'db_index': 'True'}),
            'verbose_name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'})
        },
        'm3_storage.tablefieldmodel': {
            'Meta': {'object_name': 'TableFieldModel', 'db_table': "'m3storage_fields'"},
            'allow_blank': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'attributes': ('django.db.models.fields.CharField', [], {'max_length': '300', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'indexed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'size_secondary': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'table': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_storage.StorageTableModel']"}),
            'type': ('django.db.models.fields.SmallIntegerField', [], {})
        },
        'm3_storage.tablerelationmodel': {
            'Meta': {'object_name': 'TableRelationModel', 'db_table': "'m3storage_relations'"},
            'configuration': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_storage.StorageConfigurationModel']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'left_key': ('django.db.models.fields.CharField', [], {'max_length': '300', 'blank': 'True'}),
            'left_table': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'right_key': ('django.db.models.fields.CharField', [], {'max_length': '300', 'blank': 'True'}),
            'right_table': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'type': ('django.db.models.fields.SmallIntegerField', [], {})
        }
    }

    complete_apps = ['m3_storage']
