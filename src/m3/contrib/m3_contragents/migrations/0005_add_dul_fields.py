# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Contragent.f_dul_type'
        db.add_column('m3_contragents', 'f_dul_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['m3_dicts.DulType'], null=True, blank=True), keep_default=False)

        # Adding field 'Contragent.f_dul_seria'
        db.add_column('m3_contragents', 'f_dul_seria', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=20, null=True, blank=True), keep_default=False)

        # Adding field 'Contragent.f_dul_number'
        db.add_column('m3_contragents', 'f_dul_number', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=40, null=True, blank=True), keep_default=False)

        # Adding field 'Contragent.f_dul_issue_date'
        db.add_column('m3_contragents', 'f_dul_issue_date', self.gf('django.db.models.fields.DateField')(null=True, blank=True), keep_default=False)

        # Adding field 'Contragent.f_dul_issue_by'
        db.add_column('m3_contragents', 'f_dul_issue_by', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Contragent.f_dul_type'
        db.delete_column('m3_contragents', 'f_dul_type_id')

        # Deleting field 'Contragent.f_dul_seria'
        db.delete_column('m3_contragents', 'f_dul_seria')

        # Deleting field 'Contragent.f_dul_number'
        db.delete_column('m3_contragents', 'f_dul_number')

        # Deleting field 'Contragent.f_dul_issue_date'
        db.delete_column('m3_contragents', 'f_dul_issue_date')

        # Deleting field 'Contragent.f_dul_issue_by'
        db.delete_column('m3_contragents', 'f_dul_issue_by')


    models = {
        'm3_contragents.contragent': {
            'Meta': {'object_name': 'Contragent', 'db_table': "'m3_contragents'"},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'contragent_type': ('django.db.models.fields.SmallIntegerField', [], {'default': '1'}),
            'f_dul_issue_by': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'f_dul_issue_date': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'f_dul_number': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '40', 'null': 'True', 'blank': 'True'}),
            'f_dul_seria': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'f_dul_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_dicts.DulType']", 'null': 'True', 'blank': 'True'}),
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
            'building': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True', 'blank': 'True'}),
            'comment': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'contragent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['m3_contragents.Contragent']"}),
            'flat': ('django.db.models.fields.CharField', [], {'max_length': '5', 'null': 'True', 'blank': 'True'}),
            'geo': ('django.db.models.fields.CharField', [], {'max_length': '13', 'null': 'True', 'blank': 'True'}),
            'house': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
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
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['m3_contragents.ContragentGroup']"}),
            'rght': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'tree_id': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'})
        },
        'm3_dicts.dultype': {
            'Meta': {'object_name': 'DulType'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        }
    }

    complete_apps = ['m3_contragents']
