#coding:utf-8
'''
Created on 27.02.2011

@author: akvarats
'''
from django.db.models import Model
from django.utils.encoding import force_unicode

from exceptions import (ImportRegistrationFailed,
                        MultipleReplicatedKeys)
                        
from models import ImportedObject

def register_imported_model(model_object, external_key):
    '''
    Записывает информацию об импортированной модели в БД
    '''
    
    if not model_object:
        # пустую информацию тупо и тихо не записываем
        return
    
    qname = '%s.%s' % (model_object.__class__.__module__, 
                       model_object.__class__.__name__)
    qname = qname.lower()
    
    if not isinstance(model_object, Model):
        raise ImportRegistrationFailed(u'register_imported_model: Объект не является наследником \
                                         класса django.db.models.Model (тип объекта: %s)' % qname)
    
    # В данном методе мы просто 
    # создаем новый объект, соответствующий контексту
    # загрузки данных. Возможно, стоит как-то интеллектуальнее подходить
    # к тому, что объект с таким внешним и внутренним идентификатором уже
    # был загружен в систему
    
    # пытаемся понять, был ли объект ранее импортирован в систему
    
    recently_imported_objects = ImportedObject.objects.filter(model=qname, 
                                                              ikey=model_object.id,
                                                              ekey=unicode(external_key))[0:1]
    if recently_imported_objects:
        # данный объект уже был ранее реплицирован
        imported_object = recently_imported_objects[0]
    else:
        imported_object = ImportedObject(model=qname,
                                         ikey=model_object.id,
                                         ifullkey='%s#%s' % (qname, model_object.id),
                                         ekey=unicode(external_key))
        imported_object.save()
    
    return imported_object


def get_ikey(external_key, object_type=None):
    '''
    Достает из 
    '''
    query = ImportedObject.objects
    qname = ''
    if object_type:
        qname = '%s.%s' % (object_type.__module__, 
                           object_type.__name__,)
        query = query.filter(ekey=force_unicode(external_key), model__iexact=qname)
    else:
        query = query.filter(ekey=force_unicode(external_key))
    
    # TODO: в конкретно в этом месте можно было бы вести себя как-нить попроще.
    # операция distinct может потенциально привести к снижению производительности
    # системы. С другой стороны, мы гарантируем то, что в процессе импорта,
    # мы достанем из базы именно тот реплицированный объект, который засунули
    # туда ранее
    query = query.distinct().values_list('ikey', 'model')[0:2]
    
    result = None
    
    if query:
        if len(query) > 1:
            raise MultipleReplicatedKeys(u'Значению внешнего ключа "%s" соответствует более одного значения внутреннего ключа.' % (u'%s (модель: %s)' % (external_key, qname)) if qname else external_key)
        result = query[0][0] # здесь будет находиться значение ключа
    
    
    return result
    
    
    
    
    
    