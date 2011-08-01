# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Query'
        db.create_table('m3_query_builder', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('query_json', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('m3_query_builder', ['Query'])

        # Adding model 'Report'
        db.create_table('m3_report_builder', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('query', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_query_builder.Query'])),
        ))
        db.send_create_signal('m3_query_builder', ['Report'])

        # Adding model 'ReportParams'
        db.create_table('m3_report_builder_params', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('report', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_query_builder.Report'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('verbose_name', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('type', self.gf('django.db.models.fields.SmallIntegerField')()),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('condition', self.gf('django.db.models.fields.CharField')(max_length=30)),
        ))
        db.send_create_signal('m3_query_builder', ['ReportParams'])


    def backwards(self, orm):
        
        # Deleting model 'Query'
        db.delete_table('m3_query_builder')

        # Deleting model 'Report'
        db.delete_table('m3_report_builder')

        # Deleting model 'ReportParams'
        db.delete_table('m3_report_builder_params')


    models = {
        'm3_query_builder.query': {
            'Meta': {'object_name': 'Query', 'db_table': "'m3_query_builder'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'query_json': ('django.db.models.fields.TextField', [], {})
        },
        'm3_query_builder.report': {
            'Meta': {'object_name': 'Report', 'db_table': "'m3_report_builder'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'query': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_query_builder.Query']"})
        },
        'm3_query_builder.reportparams': {
            'Meta': {'object_name': 'ReportParams', 'db_table': "'m3_report_builder_params'"},
            'condition': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'report': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_query_builder.Report']"}),
            'type': ('django.db.models.fields.SmallIntegerField', [], {}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'verbose_name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'})
        }
    }

    complete_apps = ['m3_query_builder']
