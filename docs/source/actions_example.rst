.. _actions_example:

Различные примеры action-ов и pack-ов
======================================

Базовые классы:

    .. autoclass:: m3.ui.actions.ActionPack


    .. autoclass:: m3.ui.actions.Action

Pack-и для работы с обычными справочниками
=========================================

    .. autoclass:: m3.ui.actions.packs.BaseDictionaryActions

Данный pack содержит необходимый функционал для работы со справочником. Для его использования
достаточно реализовать окно добавления/редактирования записей справочника и задать URL.

    .. autoclass:: m3.ui.actions.packs.BaseDictionaryModelActions

Данный pack является спецификацией предыдущего. Для использования необходимо дополнительно задать модель.

    .. autoclass:: m3.ui.actions.packs.BaseEnumerateDictionary

Отличие данного класса от ``BaseDictionaryModelActions`` заключается в том, что мы задаём
вместо модели класс-перечисление.

Иллюстрация:

    .. image:: images/actions/examples/BaseDictionaryActionExample.png

Общей чертой данных pack-ов является окно с таблицей и toolbar-ом, который содержит кнопки добавить, удалить, изменить.

Пример кода: ::

    class RF_Subject_DictPack(Classifier_DictPack):
        '''
        F010 - Классификатор субъектов РФ
        '''
        url = '/rf-subjects'
        shortname = 'RF_Subject_DictPack'
        title = u'F010 - Классификатор субъектов РФ'
        verbose_name = u'F010 - Классификатор субъектов РФ'
        model = dict_models.RF_Subject
        edit_window = dict_ui.RF_SubjectWindow
        need_check_permission = True
        list_columns = [
            ('code', u'Код', 15),
            ('okato', u'ОКАТО', 15),
            ('name', u'Наименование'),
            ('datebeg', u'Дата начала', 30),
            ('dateend', u'Дата окончания', 30),
        ]
        filter_fields = ['code', 'name', 'okato']


Pack-и для работы с иерархическими справочниками
==============================================

    .. autoclass:: m3.ui.actions.dicts.tree.BaseTreeDictionaryActions

Данный pack содержит необходимый функционал для работы с иерархическим справочником. Для использования необходимо
задать окна создания и редактирования записей.

    .. autoclass:: m3.ui.actions.dicts.tree.BaseTreeDictionaryModelActions

Иллюстрация:

    .. image:: images/actions/examples/BaseTreeDictionaryModelActionsExample.png

На картинке мы видим окно с двумя гридами. Данные из левого грида берутся из модели, прописанной в атрибуте класса
``tree_model``. Стоит отметить, что модель является иерархической, т.е. содержит внутри себя поле-ссылку на запись
в этой же модели. Указать данное поле можно использую атрибут класса ``tree_parent_field``. Правый грид связан с моделью
прописанной в атрибуте класса ``list_model``. Каждая запись в ``list_model`` содержит поле-ссылку на запись в ``tree_model``.
Данное поле задается атрибутом-класса ``list_parent_field``. Для использования класса достаточно реализовать окна
создания/редактирования для ``tree_model`` и ``list_model``, а также указать сами модели.

Пример кода: ::

    class MKB10_DictPack(MultiSelectableMixin, FullScreenDictionary, BaseTreeDictionaryModelActions):
        '''
        М001 - Международная классификация болезней и состояний, связанных со здоровьем 10 пересмотра (МКБ-10)
        '''
        url = '/mkb10'
        title = u'Диагнозы МКБ-10'
        verbose_name = u'Диагнозы МКБ-10'
        shortname = 'MKB10'
        column_name_on_select = 'code_plus_name'
        tree_model = dict_models.MKB10Group
        list_model = dict_models.MKB10Diag

        list_columns = [('code_plus_name', u'Диагноз МКБ')]
        tree_columns = [('code_plus_name', u'Группа МКБ')]

        list_drag_and_drop = False

        filter_fields = ['bcode', 'name']
        tree_filter_fields = ['bcode', 'name']
        list_sort_order = ['bcode']
        tree_sort_order = ['bcode']

        edit_window = dict_ui.MKB10DiagEditWindow
        edit_node_window = dict_ui.MKB10GroupEditWindow

        # Размеры окна
        width, height = 900, 500
        tree_width = 350
