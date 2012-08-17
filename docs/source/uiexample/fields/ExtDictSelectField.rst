.. _ExtDictSelectField::

ExtDictSelectField
------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtDictSelectField

    .. image:: /images/ui-example/dict_select_field.png

Является потомком ``BaseExtTriggerField``.

Флаги ``hide_trigger``, ``hide_clear_trigger``, ``hide_edit_trigger`` и
``hide_dict_select_trigger`` управляют отображением триггеров.

По умолчанию в ``ExtDictSelectField`` в качестве хранилища используется ``ExtJsonStore``.

Атрибут ``url`` содержит URL по которому будут отдаваться данные из справочника.

Свойство ``action_select`` - cсылка на action, который используется для получения окна выбора значения.

Свойство ``action_data`` - ссылка на action, который используется для получения списка строковых значений.

Метод ``configure_by_dictpack`` принимает в качестве параметров pack и controller (необязательно) и
выполняет настройку поля для работы с выбранным pack.

Пример использования: ::

    cont = ExtDictSelectField(label = u'Первый участник',
                                   url='/ui/tree-dict-window',
                                   autocomplete_url = '/ui/grid-json-store-data',
                                   ask_before_deleting=False,
                                   width=200)

    cont.display_field = 'lname'
    cont.value_field = 'id'

