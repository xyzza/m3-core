#coding: utf-8
from ui.misc import ExtJsonStore

from m3.actions import utils
from m3.actions.new_dicts.provider import DataProvider


class CatalogueVisitor(object):
    """Посетитель
        Функция - реализация обработчиков на действия пользователя
    """
    edit_window = None
    ui_creator = None
    data_provider = DataProvider

    def bind_to_window(self, base_pack, create=False, *args):

        request, context = args
        window = None
        data = None
        creator = self.ui_creator(base_pack)
        data_provider = self.data_provider(
            base_pack.list_columns,
            base_pack.model,
            base_pack.list_sort_order,
            base_pack.filter_fields)

        if create:
            window = creator.create_operation_window(*args)
        else:
            data = data_provider.get_row(request.POST.get('id'))

        return window, data

    def bind_to_model(self, base_pack, create_or_update=False, *args):

        #если create_or_update = True то производится сохранение или изменение модели,
        #если этот параметр равен False то производится удаление модели

        data_provider = self.data_provider(
            base_pack.list_columns,
            base_pack.model,
            base_pack.list_sort_order,
            base_pack.filter_fields)

        if create_or_update:
            data, errors = data_provider.save_row(*args)
        else:
            data, errors = data_provider.delete_row(*args)

        success = False if errors else True
        #errors - ошибки бизнес-логики будут отображены в виде всплывающего сообщения
        return None, {"success": success, "data": data, "errors": errors}

    def set_select_mode(self, base_pack, window):
        #изменение режима работы окна
        window.modal = True
        # list_store = ExtJsonStore(
        #     url=self.base.last_used_action.get_absolute_url(),
        #     auto_load=False)
        # window.list_view.set_store(list_store)
        window.column_name_on_select = base_pack.column_name_on_select
        return window

    def bind_to_store(self, base_pack, create=False, select=False, *args):

        window, data = None, None
        request, context = args
        creator = self.ui_creator(base_pack)

        provider = self.data_provider(
            base_pack.list_columns,
            base_pack.model,
            base_pack.list_sort_order,
            base_pack.filter_fields
        )

        if create:
            mode = 0 if not select else 1
            win = creator.create_window(request, context, mode=mode)
            win.orig_request = request
            win.orig_context = context
            creator.create_columns(win.grid, base_pack.list_columns)
            creator.configure_list(win)
            if select:
                self.set_select_mode(base_pack, win)
            # проверим право редактирования
            if getattr(request, 'user', None):
                if not base_pack.has_sub_permission(request.user,
                    base_pack.PERM_EDIT, request):
                    win.make_read_only()

            creator.configure_window(win, request, context)
            window = win

        else:
            offset = utils.extract_int(request, 'start')
            limit = utils.extract_int(request, 'limit')
            filter = request.REQUEST.get('filter')
            direction = request.REQUEST.get('dir')
            user_sort = request.REQUEST.get('sort')
            if direction == 'DESC':
                user_sort = '-' + user_sort
            dict_list = []

            for item in base_pack.list_columns:
                if isinstance(item, (list, tuple)):
                    dict_list.append(item[0])
                elif isinstance(item, dict) and item.get('data_index'):
                    dict_list.append(item['data_index'])

            data = provider.get_rows(
                request, context, offset, limit, filter, user_sort)

        return window, data


