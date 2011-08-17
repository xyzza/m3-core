# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Query.use_dict_result'
        db.add_column('m3_query_builder', 'use_dict_result', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Query.use_dict_result'
        db.delete_column('m3_query_builder', 'use_dict_result')


    models = {
        'm3_query_builder.query': {
            'Meta': {'object_name': 'Query', 'db_table': "'m3_query_builder'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'query_json': ('django.db.models.fields.TextField', [], {}),
            'use_dict_result': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
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
