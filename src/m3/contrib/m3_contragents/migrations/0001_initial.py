# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'ContragentGroup'
        db.create_table('m3_contragent_groups', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('contragent_type', self.gf('django.db.models.fields.SmallIntegerField')(default=0, null=True, blank=True)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_contragents.Contragent'], null=True, blank=True)),
            ('lft', self.gf('django.db.models.fields.PositiveIntegerField')(default=0, db_index=True)),
            ('rght', self.gf('django.db.models.fields.PositiveIntegerField')(default=0, db_index=True)),
            ('tree_id', self.gf('django.db.models.fields.PositiveIntegerField')(default=0, db_index=True)),
            ('level', self.gf('django.db.models.fields.PositiveIntegerField')(default=0, db_index=True)),
        ))
        db.send_create_signal('m3_contragents', ['ContragentGroup'])

        # Adding model 'Contragent'
        db.create_table('m3_contragents', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('contragent_type', self.gf('django.db.models.fields.SmallIntegerField')(default=0)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_contragents.ContragentGroup'], null=True, blank=True)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('u_short_name', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('u_full_name', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('u_inn', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, blank=True)),
            ('u_kpp', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, blank=True)),
            ('u_okved', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, blank=True)),
            ('u_ogrn', self.gf('django.db.models.fields.CharField')(max_length=13, null=True, blank=True)),
            ('u_okpo', self.gf('django.db.models.fields.CharField')(max_length=8, null=True, blank=True)),
            ('f_fname', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('f_iname', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('f_oname', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('f_inn', self.gf('django.db.models.fields.CharField')(max_length=12, null=True, blank=True)),
            ('f_snils', self.gf('django.db.models.fields.CharField')(max_length=11, null=True, blank=True)),
        ))
        db.send_create_signal('m3_contragents', ['Contragent'])


    def backwards(self, orm):
        
        # Deleting model 'ContragentGroup'
        db.delete_table('m3_contragent_groups')

        # Deleting model 'Contragent'
        db.delete_table('m3_contragents')


    models = {
        'm3_contragents.contragent': {
            'Meta': {'object_name': 'Contragent', 'db_table': "'m3_contragents'"},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'contragent_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '0'}),
            'f_fname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_iname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_inn': ('django.db.models.fields.CharField', [], {'max_length': '12', 'null': 'True', 'blank': 'True'}),
            'f_oname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_snils': ('django.db.models.fields.CharField', [], {'max_length': '11', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.ContragentGroup']", 'null': 'True', 'blank': 'True'}),
            'u_full_name': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'u_inn': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_kpp': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_ogrn': ('django.db.models.fields.CharField', [], {'max_length': '13', 'null': 'True', 'blank': 'True'}),
            'u_okpo': ('django.db.models.fields.CharField', [], {'max_length': '8', 'null': 'True', 'blank': 'True'}),
            'u_okved': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_short_name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'})
        },
        'm3_contragents.contragentgroup': {
            'Meta': {'object_name': 'ContragentGroup', 'db_table': "'m3_contragent_groups'"},
            'contragent_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'lft': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.Contragent']", 'null': 'True', 'blank': 'True'}),
            'rght': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'tree_id': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'})
        }
    }

    complete_apps = ['m3_contragents']
