# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'DocumentSection.parent'
        db.add_column('m3_docs_doc_section', 'parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_docs.DocumentSection'], null=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'DocumentSection.parent'
        db.delete_column('m3_docs_doc_section', 'parent_id')


    models = {
        'm3_docs.documentfield': {
            'Meta': {'object_name': 'DocumentField', 'db_table': "'m3_docs_doc_field'"},
            'allow_blank': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'decimal_precision': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True'}),
            'document_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'meta': ('django.db.models.fields.TextField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'order_index': ('django.db.models.fields.IntegerField', [], {}),
            'regexp': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'section': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentSection']", 'null': 'True'}),
            'type': ('django.db.models.fields.PositiveIntegerField', [], {})
        },
        'm3_docs.documentsection': {
            'Meta': {'object_name': 'DocumentSection', 'db_table': "'m3_docs_doc_section'"},
            'document_type': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sections'", 'to': "orm['m3_docs.DocumentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'multiple': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'order_index': ('django.db.models.fields.IntegerField', [], {}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentSection']", 'null': 'True'})
        },
        'm3_docs.documenttype': {
            'Meta': {'object_name': 'DocumentType', 'db_table': "'m3_docs_doc_type'"},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentTypeGroup']"})
        },
        'm3_docs.documenttypegroup': {
            'Meta': {'object_name': 'DocumentTypeGroup', 'db_table': "'m3_docs_doc_type_group'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentTypeGroup']", 'null': 'True'})
        }
    }

    complete_apps = ['m3_docs']
