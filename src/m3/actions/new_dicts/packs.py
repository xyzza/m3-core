#coding: utf-8
from m3.actions import ActionPack
from m3.actions.interfaces import ISelectablePack

from actions import BaseDictActionFactory
from visitors import CatalogueVisitor


class BaseCataloguePack(ActionPack, ISelectablePack):
    """импользуем композицию для разделения ответственности
       выполнения действий с моделью
       сам пак отвечает за осуществление доступа к данным в системе
       он регистрирует приложение в системе (организует интерфейс доступа)

       фабрика экшенов - хранит экземпляры экшенов для осуществления
        действий по работе с моделью
       посетитель - ему переадресуется выполнение операций по работе
       с моделью (срабатывание экшенов)
    """
    _factory_class = BaseDictActionFactory
    _visitor = CatalogueVisitor

    title = '' # для записи
    title_plural = '' # для списка

    list_columns = []
    filter_fields = []
    # Настройки секретности. Если стоит истина, то в результат добавляется флаг секретности
    secret_json = False
    secret_form = False

    # Ширина и высота окна
    width, height = 510, 400

    list_paging = True
    list_readonly = False
    list_sort_order = None

    # Значение колонки по-умолчанию, которое будет подбираться
    # при выборе значения из справочника
    column_name_on_select = 'name'

    # Добавлена ли возможность копирования
    allow_copy = False

    # права доступа для базовых справочников
    PERM_EDIT = 'edit'
    sub_permissions = {PERM_EDIT: u'Редактирование справочника'}

    def __init__(self):
        super(BaseCataloguePack, self).__init__()

    @property
    def visitor(self):
        return self._visitor

    def create_actions(self):
        actions = self._factory.create()

        for a in actions:
            concrete_visitor = self._visitor()
            a.visitor = concrete_visitor

        return actions

    def __init__(self):
        super(BaseCataloguePack, self).__init__()
        self._factory = self._factory_class()
        actions = self.create_actions()
        self.actions.extend(actions)
        #адаптируем экшены для совместимости интерфейсов
        self._factory.adapt(self)

    def get_list_url(self):
        return self.list_window_action.get_absolute_url()

    def get_url_data(self):
        return self.load_action.get_absolute_url()

    def get_edit_url(self):
        """ Получить адрес для запроса диалога редактирования выбранного элемента """
        return self.edit_window_action.get_absolute_url()

    def get_autocomplete_url(self):
        """ Получить адрес для запроса элементов подходящих введенному в поле тексту """
        return self.rows_action.get_absolute_url()

    def get_select_url(self):
        """ Получить адрес для запроса диалога выбора элемента """
        return self.select_window_action.get_absolute_url()

    def get_display_text(self, key, attr_name=None):
        """ Получить отображаемое значение записи (или атрибута attr_name) по ключу key """
        pass