#coding:utf-8

from django.db import models, connection, transaction, IntegrityError
from django.db.models.query import QuerySet

def safe_delete(model):
    '''
    Класс, выполняющий "безопастное" удаление записи из БД.
    
    В случае, если удаление не удалось по причине нарушения целостности,
    то возвращается false. Иначе, true
    '''
    try:
        cursor = connection.cursor()
        sql = "DELETE FROM %s WHERE id = %s" % (model.__class__._meta.db_table, model.id)
        cursor.execute(sql)
        transaction.commit_unless_managed()
    except IntegrityError:
        return False
    
    return True

def queryset_limiter(queryset, start=0, limit=0):
    '''
    Извлекает из QuerySet'a список записей начиная с позиции start до записи start+limit.
    Возвращает (rows, total, ), где
    rows - список отобранных записей
    total - общее кол-во записей в queryset'e
    '''
    
    assert isinstance(queryset, QuerySet), 'queryset must be instance of django.db.models.query.QuerySet' 
    
    if start < 0:
        start = 0
    if limit < 0:
        limit = 0
    total = queryset.count()
    rows = queryset[start:start+limit]
    return (list(rows), total,)

class BaseEnumerate(object):
    '''
    Базовый класс для создания перечислений.
    '''
    # В словаре values описываются перечисляемые константы и их человеческое название
    # Например: {STATE1: u'Состояние 1', CLOSED: u'Закрыто'}
    values = {}
    
    @classmethod
    def get_choices(cls):
        ''' Используется для ограничения полей ORM. '''
        return cls.values.items()
    
    @classmethod
    def get_items(cls):
        ''' Используется как источник данных в ArrayStore и DataStore ExtJS '''
        return cls.values.items()

class BaseObjectModel(models.Model):
    '''
    Базовая модель для объектов системы. Сюда будут добавляться общие свойства и методы, которые могут быть перекрыты в дальнейшем
    '''
    def display(self):
        '''
        Отображение объекта по-умолчанию
        '''
        return unicode(self)
    display.json_encode = True

    def __unicode__(self):
        return u'{%s}' % self.pk

    class Meta:
        abstract = True
