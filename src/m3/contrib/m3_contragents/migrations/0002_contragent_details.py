# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'ContragentAddress'
        db.create_table('m3_contragent_addresses', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('contragent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_contragents.Contragent'])),
            ('address_type', self.gf('django.db.models.fields.PositiveIntegerField')(default=1)),
            ('comment', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('geo', self.gf('django.db.models.fields.CharField')(max_length=13, null=True, blank=True)),
            ('street', self.gf('django.db.models.fields.CharField')(max_length=17, null=True, blank=True)),
            ('address', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
        ))
        db.send_create_signal('m3_contragents', ['ContragentAddress'])

        # Adding model 'ContragentContact'
        db.create_table('m3_contragent_contacts', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('contragent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_contragents.Contragent'])),
            ('primary', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
            ('comment', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('send_to', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
            ('phone', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('fax', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('email', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal('m3_contragents', ['ContragentContact'])

        # Adding model 'ContragentBankDetail'
        db.create_table('m3_contragent_bankdetails', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('contragent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='bank_details', null=True, to=orm['m3_contragents.Contragent'])),
            ('bank_contragent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='customer_details', null=True, to=orm['m3_contragents.Contragent'])),
            ('bank_name', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('bik', self.gf('django.db.models.fields.CharField')(max_length=9, null=True, blank=True)),
            ('rschet', self.gf('django.db.models.fields.CharField')(max_length=20, null=True, blank=True)),
            ('kschet', self.gf('django.db.models.fields.CharField')(max_length=20, null=True, blank=True)),
            ('lschet', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal('m3_contragents', ['ContragentBankDetail'])

        # Adding field 'Contragent.u_filial'
        db.add_column('m3_contragents', 'u_filial', self.gf('django.db.models.fields.CharField')(max_length=20, null=True, blank=True), keep_default=False)

        # Changing field 'Contragent.code'
        db.alter_column('m3_contragents', 'code', self.gf('django.db.models.fields.CharField')(max_length=30, null=True))


    def backwards(self, orm):
        
        # Deleting model 'ContragentAddress'
        db.delete_table('m3_contragent_addresses')

        # Deleting model 'ContragentContact'
        db.delete_table('m3_contragent_contacts')

        # Deleting model 'ContragentBankDetail'
        db.delete_table('m3_contragent_bankdetails')

        # Deleting field 'Contragent.u_filial'
        db.delete_column('m3_contragents', 'u_filial')

        # Changing field 'Contragent.code'
        db.alter_column('m3_contragents', 'code', self.gf('django.db.models.fields.CharField')(max_length=30))


    models = {
        'm3_contragents.contragent': {
            'Meta': {'object_name': 'Contragent', 'db_table': "'m3_contragents'"},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'contragent_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '1'}),
            'f_fname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_iname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_inn': ('django.db.models.fields.CharField', [], {'max_length': '12', 'null': 'True', 'blank': 'True'}),
            'f_oname': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'f_snils': ('django.db.models.fields.CharField', [], {'max_length': '11', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.ContragentGroup']", 'null': 'True', 'blank': 'True'}),
            'u_filial': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'u_full_name': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'u_inn': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_kpp': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_ogrn': ('django.db.models.fields.CharField', [], {'max_length': '13', 'null': 'True', 'blank': 'True'}),
            'u_okpo': ('django.db.models.fields.CharField', [], {'max_length': '8', 'null': 'True', 'blank': 'True'}),
            'u_okved': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'u_short_name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'})
        },
        'm3_contragents.contragentaddress': {
            'Meta': {'object_name': 'ContragentAddress', 'db_table': "'m3_contragent_addresses'"},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'address_type': ('django.db.models.fields.PositiveIntegerField', [], {'default': '1'}),
            'comment': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'contragent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.Contragent']"}),
            'geo': ('django.db.models.fields.CharField', [], {'max_length': '13', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'street': ('django.db.models.fields.CharField', [], {'max_length': '17', 'null': 'True', 'blank': 'True'})
        },
        'm3_contragents.contragentbankdetail': {
            'Meta': {'object_name': 'ContragentBankDetail', 'db_table': "'m3_contragent_bankdetails'"},
            'bank_contragent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'customer_details'", 'null': 'True', 'to': "orm['m3_contragents.Contragent']"}),
            'bank_name': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'bik': ('django.db.models.fields.CharField', [], {'max_length': '9', 'null': 'True', 'blank': 'True'}),
            'contragent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'bank_details'", 'null': 'True', 'to': "orm['m3_contragents.Contragent']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kschet': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'lschet': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'rschet': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'})
        },
        'm3_contragents.contragentcontact': {
            'Meta': {'object_name': 'ContragentContact', 'db_table': "'m3_contragent_contacts'"},
            'comment': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'contragent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.Contragent']"}),
            'email': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'fax': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'phone': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'primary': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'send_to': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'})
        },
        'm3_contragents.contragentgroup': {
            'Meta': {'object_name': 'ContragentGroup', 'db_table': "'m3_contragent_groups'"},
            'contragent_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '1', 'null': 'True', 'blank': 'True'}),
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
