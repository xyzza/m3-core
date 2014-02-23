#coding: utf-8
import copy
from m3.actions import utils
from m3.actions.new_dicts.data_utils import ObjectFromJson


class DataProvider(object):

    model = None
    viewable_fields = None

    def __init__(self, fields, model, sort_order, filter_fields):
        self.model = model
        self.viewable_fields = copy.deepcopy(fields)
        self.filter_fields = copy.deepcopy(filter_fields)
        self.list_sort_order = sort_order

    def get_row(self, id_):
        """получение данных для заполнения формы
        """
        errors = []
        try:
            model = self.model.objects.get(id=id_)
        except models.exceptions.DoesNotExist as err:
            errors.append(u"Объект не найден. Возможно он был удален.")

        return {"data": model, "errors": errors}

    def _default_filter(self):
        '''
        Устанавливаем параметры поиска по умолчанию 'code' и 'name' в случае,
        если у модели есть такие поля
        '''
        filter_fields = self.filter_fields
        if not filter_fields:
            filter_fields.extend([field.attname for field in self.model._meta.local_fields\
                                  if field.attname in ('code', 'name')])
        return filter_fields

    def get_rows(self, request, context, offset, limit, filter, user_sort):

        if user_sort:
            sort_order = [user_sort] if not isinstance(user_sort, (list, tuple,)) else user_sort
        else:
            sort_order = self.list_sort_order
        filter_fields = self._default_filter()

        query = utils.apply_sort_order(self.model.objects, self.viewable_fields, sort_order)
        query = utils.apply_search_filter(query, filter, filter_fields)
        query = utils.detect_related_fields(query, self.viewable_fields)

        query = self.modify_get_rows(query, request, context)
        total = query.count()

        if limit > 0:
            query = query[offset: offset + limit]

        result = {'rows': list(query.all()), 'total': total}
        return result

    def modify_get_rows(self, query, request, context):
        return query

    def save_row(self, *args):
        request, context = args
        id_ = utils.extract_int(request, 'id')
        if not id_:
            raw_obj = self.model()
        else:
            raw_obj = self.model.objects.get(id=id_)
        obj = ObjectFromJson(raw_obj, context.__dict__)

        valid, errors = self.presave_object(obj, request)
        if valid:
            result = obj.save()
        else:
            result = None

        return result, errors

    def delete_row(self, *args):
        request, context = args
        id_ = utils.extract_int(request, 'id')
        obj = self.model.objects.get(id=id_)
        obj.safe_delete()
        data, errors = self.predelete_object(request)
        return result, {"data": data, "errors": errors}

    def presave_object(self, obj, request):
        return True, []

    def predelete_object(self, request):
        return True, []