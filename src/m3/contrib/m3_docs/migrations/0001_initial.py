# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'DocumentTypeGroup'
        db.create_table('m3_docs_doc_type_group', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_docs.DocumentTypeGroup'], null=True)),
        ))
        db.send_create_signal('m3_docs', ['DocumentTypeGroup'])

        # Adding model 'DocumentType'
        db.create_table('m3_docs_doc_type', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_docs.DocumentTypeGroup'])),
        ))
        db.send_create_signal('m3_docs', ['DocumentType'])

        # Adding model 'DocumentField'
        db.create_table('m3_docs_doc_field', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('document_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_docs.DocumentType'])),
            ('section', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_docs.DocumentSection'], null=True)),
            ('type', self.gf('django.db.models.fields.PositiveIntegerField')()),
            ('allow_blank', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('regexp', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
            ('decimal_precision', self.gf('django.db.models.fields.PositiveIntegerField')(null=True)),
            ('meta', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('m3_docs', ['DocumentField'])

        # Adding model 'DocumentSection'
        db.create_table('m3_docs_doc_section', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('document_type', self.gf('django.db.models.fields.related.ForeignKey')(related_name='sections', to=orm['m3_docs.DocumentType'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('multiple', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('m3_docs', ['DocumentSection'])


    def backwards(self, orm):
        
        # Deleting model 'DocumentTypeGroup'
        db.delete_table('m3_docs_doc_type_group')

        # Deleting model 'DocumentType'
        db.delete_table('m3_docs_doc_type')

        # Deleting model 'DocumentField'
        db.delete_table('m3_docs_doc_field')

        # Deleting model 'DocumentSection'
        db.delete_table('m3_docs_doc_section')


    models = {
        'm3_docs.documentfield': {
            'Meta': {'object_name': 'DocumentField', 'db_table': "'m3_docs_doc_field'"},
            'allow_blank': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'decimal_precision': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True'}),
            'document_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'meta': ('django.db.models.fields.TextField', [], {}),
            'regexp': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'section': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_docs.DocumentSection']", 'null': 'True'}),
            'type': ('django.db.models.fields.PositiveIntegerField', [], {})
        },
        'm3_docs.documentsection': {
            'Meta': {'object_name': 'DocumentSection', 'db_table': "'m3_docs_doc_section'"},
            'document_type': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sections'", 'to': "orm['m3_docs.DocumentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'multiple': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'})
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
