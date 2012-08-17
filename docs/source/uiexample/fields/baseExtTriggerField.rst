.. _baseExtTriggerField::

BaseExtTriggerField
-------------------

    .. autoclass:: m3.ui.ext.fields.base.BaseExtTriggerField


Атрибут ``display_field``, содержит имя поля, которое отображается при выборе.

Атрибут ``value_field``, содержит имя поля, которое используется в качестве значения.

Пример combobox: ::

    combo_box = ExtComboBox(display_field='name', value_field='id')
    combo_box.store = ExtDataStore(display_field='name', value_field='id')

Вот, что получится:

    .. image:: /images/ui-example/trigger_field_example.png

Если пользователь выберет second_record, то на сервер отправится значение 2.

Флаг ``hide_trigger`` позволяет скрыть триггер выпадающего списка: ::

    combo_box = ExtComboBox(display_field='name', value_field='id', hide_trigger=True)

Иллюстрация:

    .. image:: /images/ui-example/hide_trigger.png

Флаг ``type_ahead`` разрешает автозаполнение.

    .. image:: /images/ui-example/type_ahead_example.png

Атрибут ``trigger_action`` может принимать два значения: ``BaseExtTriggerField.ALL`` или
``BaseExtTriggerField.Query``. Смысл параметра это имя запроса откуда будут браться данные
для заполнения выпадающего списка. Например, мы выбрали запись second_record. Тогда при
повторном нажатие на триггер будут отображаться только те записи, что соответсвуют данной.
Пример: ::

    combo_box = ExtComboBox(display_field='name', value_field='id', trigger_action=BaseExtTriggerField.QUERY)
    combo_box.store = ExtDataStore(data=[(1, 'first record'),(2, 'second record'), (3, 'second record 2')])

Иллюстрация:

    .. image:: /images/ui-example/trigger_action.png

Атрибут ``page_size`` указывает количество записей на одной странице выпадающего списка ::

    combo_box = ExtComboBox(display_field='name', hidden_name='id', trigger_action=BaseExtTriggerField.ALL, page_size=2)
    combo_box.store = ExtDataStore(data=[(1, 'first record'),(2, 'second record'), (3, 'second record 2')])

Boт, что получится:
    .. image:: /images/ui-example/trigger_field_page_size.png

Атрибут ``max_heigth_dropdown_list`` содержит максимальную высоту выпадающего списка.

Атрибут ``min_chars`` - количество символов, которое необходимо ввести для выполнения запроса.

Свойство ``store`` задает хранилище данных для поля. Атрибут ``mode``, в свою очередь указывает какое хранилище:
локальное или удаленное ('local' или 'remote').

Флаг ``editable`` разрешает или запрещает вводить текст в поле.

Флаг ``force_selection`` включает возможность заполнение поля после потери фокуса.

Атрибут ``not_found_text`` - текст, если записей в store нет.

Атрибут ``loading_text`` - текст, отображаемый при загрузке данных.

Атрибут ``fields`` - список полей, который будут присутствовать в store.

Атрибут ``list_width`` - ширина выпадающего списка.

Флаг ``resizable`` - управляет возможностью изменять ширину выпадающего списка

    .. image:: /images/ui-example/trigger_field_resizable.png