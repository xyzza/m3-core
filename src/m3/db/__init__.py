#coding:utf-8

from django.db import models, connection, transaction, IntegrityError

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
    