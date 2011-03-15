#coding:utf-8

from django.db import models, connection, transaction, IntegrityError, router
from django.db.models.query import QuerySet, delete_objects
from django.db.models.query_utils import CollectedObjects
from m3.core.exceptions import RelatedError

def safe_delete(model):
    '''
    Функция выполняющая "безопасное" удаление записи из БД.
    В случае, если удаление не удалось по причине нарушения целостности,
    то возвращается false. Иначе, true
    к тому же функция пересчитывает MPTT индексы дерева
    т.к. стандартный пересчет запускается при вызове model_instance.delete() 
    '''
    models.signals.pre_delete.send(sender=model.__class__, instance=model)
    try:
        cursor = connection.cursor() #@UndefinedVariable
        sql = "DELETE FROM %s WHERE id = %s" % (connection.ops.quote_name(model._meta.db_table), model.id) #@UndefinedVariable
        cursor.execute(sql)
        transaction.commit_unless_managed()
    except Exception, e:
        # Встроенный в Django IntegrityError не генерируется. Кидаются исключения 
        # специфичные для каждого драйвера БД. Но по спецификации PEP 249 все они
        # называются IntegrityError
        if e.__class__.__name__ == 'IntegrityError':
            return False
        raise

    #добавим пересчет mptt дерева (т.к. стандартный пересчет вешается на метод self.delete()
    if hasattr(model, '_tree_manager') and callable(getattr(model._tree_manager, '_close_gap', None)):
        #это видимо mptt моедль
        opts = model._meta
        tree_width = (getattr(model, opts.right_attr) -
                      getattr(model, opts.left_attr) + 1)
        target_right = getattr(model, opts.right_attr)
        tree_id = getattr(model, opts.tree_id_attr)
        model._tree_manager._close_gap(tree_width, target_right, tree_id)        
    
    models.signals.post_delete.send(sender=model.__class__, instance=model)
    return True

def queryset_limiter(queryset, start=0, limit=0):
    '''
    "Вырезает" из QuerySet'a записи начиная с позиции start до записи start+limit.
    Возвращает (rows, total, ), где
    rows -  QuerySet с вырезанными записями
    total - общее кол-во записей в queryset'e
    '''
    
    assert (isinstance(queryset, QuerySet) or getattr(queryset, '__iter__')), \
    'queryset must be either instance of django.db.models.query.QuerySet or iterable' 
    
    if start < 0:
        start = 0
    if limit < 0:
        limit = 0
    total = queryset.count() if isinstance(queryset, QuerySet) else len(queryset)
    rows = queryset[start:start+limit]
    return (rows, total,)

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
    """
    Базовая модель для объектов системы. 
    Сюда будут добавляться общие свойства и методы, которые могут быть перекрыты в дальнейшем
    """
    def display(self):
        """
        Отображение объекта по-умолчанию. Отличается от __unicode__ тем,
        что вызывается при json сериализации в m3.core.json.M3JSONEncoder
        """
        return unicode(self)
    display.json_encode = True

    def __unicode__(self):
        """ Определяет текстовое представление объекта """
        return u'{%s}' % self.pk
    
    @classmethod
    def get_verbose_name(cls):
        return cls._meta.verbose_name

    def safe_delete(self):
        """
        Функция выполняющая "безопасное" удаление записи из БД.
        В случае, если запись не удалось удалисть по причине нарушения
        целостности, возвращается False, иначе True.
        """
        return safe_delete(self)

    def get_related_objects(self):
        """
        Возвращает структуру содержащую классы моделей, первичные ключи и экземпляры записей,
        зависящие от текущей записи. Возвращаемая структура имеет вид:
        [(КлассМодели1, {id1: ЭкземплярМодели1cID1, id2: ЭкземплярМодели1cID2, ...} ),
         (КлассМодели2, {id1: ЭкземплярМодели2cID1, id2: ЭкземплярМодели2cID2, ...} },
         ...]
        """
        seen_objs = CollectedObjects()
        self._collect_sub_objects(seen_objs)
        return seen_objs.items()
    
    def delete_related(self, affected=None, using=None):
        """
        Стандартное каскадное удаление объектов в django, дополненное проверкой на 
        удаляемые классы моделей affected. По умолчанию affected содержит пустой 
        список - это ограничивает удаляемые модели только текущим классом.
        К перечисленным в affected классам текущий добавляется автоматически.
        Если удаление не удалось выполнить, возвращает False, иначе True.
        Пример: Model1.objects.get(id=1).delete_related(affected=[Model2, Model3])
        """
        # Кописаст из django.db.models.Model delete()
        using = using or router.db_for_write(self.__class__, instance=self)
        assert self._get_pk_val()!=None, "%s object can't be deleted because its %s attribute is set to None." %\
                                         (self._meta.object_name, self._meta.pk.attname)
        
        affected = affected or []
        assert isinstance(affected, list), 'Affected models must be the list type'
        affected.append(self.__class__)
        
        seen_objs = CollectedObjects()
        self._collect_sub_objects(seen_objs)
        for model, _ in seen_objs.iteritems():
            if model not in affected:
                return False
         
        delete_objects(seen_objs, using)
        return True

    class Meta:
        abstract = True
