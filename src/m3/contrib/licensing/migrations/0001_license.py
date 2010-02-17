#coding:utf-8

from south.db import db
from django.db import models
from m3.contrib.licensing.models import *

class Migration:
    
    def forwards(self, orm):
        
        # Adding model 'StoredLicKey'
        db.create_table('m3_licensing_stored_lic_key', (
            ('id', orm['licensing.StoredLicKey:id']),
            ('date_added', orm['licensing.StoredLicKey:date_added']),
            ('body', orm['licensing.StoredLicKey:body']),
        ))
        db.send_create_signal('licensing', ['StoredLicKey'])
        
    
    
    def backwards(self, orm):
        
        # Deleting model 'StoredLicKey'
        db.delete_table('m3_licensing_stored_lic_key')
        
    
    
    models = {
        'licensing.storedlickey': {
            'Meta': {'db_table': "'m3_licensing_stored_lic_key'"},
            'body': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'date_added': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }
    
    complete_apps = ['licensing']
