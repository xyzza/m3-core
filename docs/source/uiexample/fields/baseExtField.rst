.. _baseExtField::

BaseExtField
----------------

    .. autoclass:: m3.ui.ext.fields.base.BaseExtField

Атрибут ``value`` - значение по-умолчанию.

    .. image:: /images/ui-example/field_value.png

Атрибут ``read_only`` - признак нередактируемости поля.

    .. image:: /images/ui-example/field_read_only.png

Атрибут ``allow_blank`` - признак (не)обязательности заполнения.
Атрибут ``vtype`` - тип валидации.
Атрибут ``empty_text`` - текст, который будет выводится, если поле незаполненно. Отличие от
``value`` состоит в том, что при изменении значения поля ``value`` не возвращается обратно.

Атрибут ``min_length`` - минимальная длина поля. ``min_length_text`` - сообщение о том, что
количество символов в поле меньше минимально допустимой величины. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', min_length=3, min_length_text=u'Мало символов')

Вот, что получится:

    .. image:: /images/ui-example/field_min_len_new.png

Атрибут ``max_length`` - максимальная длина содержимого поля. ``max_length_text`` - сообщение о том, что
количество символов в поле больше максимально допустимой величины. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', max_length=3, max_length_text=u'Много символов')

Вот, что получится в этом случае:

    .. image:: /images/ui-example/field_max_len.png

Атрибут ``regex`` - шаблон регулярного выражения для валидации введенного текста. ``regex_text`` -
сообщение об ошибке, если введенный текст не соответствует шаблону. Пример: ::

    field = ExtStringField(value=u'по-умолчанию', anchor='100%', regex='[0-7]', regex_text=u'Только цифры от 0 до 7')

Вот, что получится в этом случае:

    .. image:: /images/ui-example/field_regex.png

Атрибут ``plugins`` - список плагинов для подключения к полю.