# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'NotifyTemplate'
        db.create_table('m3_notify_notifytemplate', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('template_id', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=300, null=True)),
            ('body', self.gf('django.db.models.fields.TextField')()),
            ('default_backend', self.gf('django.db.models.fields.SmallIntegerField')(default=1, null=True)),
        ))
        db.send_create_signal('m3_notify', ['NotifyTemplate'])


    def backwards(self, orm):
        
        # Deleting model 'NotifyTemplate'
        db.delete_table('m3_notify_notifytemplate')


    models = {
        'm3_notify.notifytemplate': {
            'Meta': {'object_name': 'NotifyTemplate'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'default_backend': ('django.db.models.fields.SmallIntegerField', [], {'default': '1', 'null': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'template_id': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        }
    }

    complete_apps = ['m3_notify']
