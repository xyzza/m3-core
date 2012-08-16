.. _work_with_fields::

Работа с полями
================


1) BaseExtField
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

2) ExtStringField
-----------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtStringField

    .. image:: /images/ui-example/string_field.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TextField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TextField>`_.

Атрибут ``input_mask`` - задает маску ввода. Пример: ::

    field = ExtStringField(anchor='100%', input_mask="(###)###-##-##")

Иллюстрация:

    .. image:: /images/ui-example/input_mask.png

3) ExtDateField
---------------

    .. autoclass:: m3.ui.ext.field.simple.ExtDateField

    .. image:: /images/ui-example/datefield.png

Является потомком ``BaseExtField``. Обертка `Ext.form.DateField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.DateField>`_

Атрибут ``start_day`` - числое значение(0-6), которое задает день с которого начинается неделя в календаре.
(0-Воскресенье, 1-понедельник, 2-вторник и т.д.) ::

    field = ExtDateField(anchor='100%', start_day=3)

Иллюстрация:

    .. image:: /images/ui-example/start_day.png

Флаг ``hide_today_btn`` позволяет скрыть кнопку, при нажатие на которую в поле проставляется
текущая дата.

    .. image:: /images/ui-example/hide_today_btn.png

Атрибуты ``max_value`` и ``min_value`` задают максимальное и минимальное значение даты в поле.

Атрибут ``format`` позволяет указывать формат даты.

4) ExtNumberField
------------------

    .. autoclass:: m3.ui.ext.field.simple.ExtNumberField

Является потомком ``BaseExtField``. Обертка `Ext.form.NumberField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.NumberField>`_

Атрибут ``decimal_separator`` задает разделитель целой и дробной части.
Атрибут ``allow_decimals`` разрешает или запрещает присутствие дробной части.
Атрибут ``allow_negative`` разрешает или запрещает вводить отрицательные числа.
Атрибут ``decimal_precision`` задает точность дробной части.
Атрибуты ``max_value`` и ``min_value`` задают верхнюю и нижнюю границу для вводимых данных.
Атрибуты ``max_text`` и ``min_text`` задают сообщения при нарушении границы допустипых значений.

5) ExtHiddenField
------------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtHiddenField

Является потомком ``BaseExtField``. Обертка `Ext.form.Hidden <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Hidden>`_

Атрибут ``type`` задает тип данного поля. Возможны два варианта ( ``ExtHiddenField.INT`` = 0 и ``ExtHiddenField.STRING`` = 1).
Обычно данное поле используют для хранения идентификатора обьекта. Его не нужно показывать пользователю, но
оно полезно при submit-е.

6) ExtTextArea
--------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTextArea

    .. image:: /images/ui-example/textarea.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TextArea <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TextArea>`_

Атрибут ``mask_re`` задает фильтр символов по шаблону регулярного выражения.

7) ExtCheckBox
--------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtCheckBox

Является потомком ``BaseExtField``. Обертка `Ext.form.Checkbox <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Checkbox>`_

Атрибут ``checked`` - признак того, что значение выбрано.
Атрибут ``box_label`` - текст рядом с полем выбора значения. Пример: ::

    field = ExtCheckBox(anchor='100%', checked=True, box_label=u'Значение выбрано потому, что checked = True')

Иллюстрация к примеру:

    .. image:: /images/ui-example/checkbox.png

8) ExtRadio
-----------

    .. autoclass:: m3.ui.ext.fields.simple.ExtRadio

Является потомком ``BaseExtField``. Обертка `Ext.form.Radio <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Radio>`_

Атрибуты аналогичны ``ExtCheckBox``.

Иллюстрация:

    .. image:: /images/ui-example/radio.png

9) ExtTimeField
---------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTimeField

    .. image:: /images/ui-example/timefield.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TimeField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TimeField>`_

Атрибут ``format`` задает формат отображения времени
Атрибут ``increment`` задает временной интервал между значениями в выпадающем списке. Например на
иллюстрации выше, это значение равно 15 минутам.

Атрибуты ``max_value`` и ``min_value`` задают верхнюю и нижнюю границу для времени.

10) ExtHTMLEditor
-----------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtHTMLEditor

    .. image:: /images/ui-example/htmleditor.png

Является потомком ``BaseExtField``. Обертка `Ext.form.HtmlEditor <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.HtmlEditor>`_

11) ExtDisplayField
--------------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtDisplayField

Является потомком ``BaseExtField``. Обертка `Ext.form.DisplayField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.DisplayField>`_

12) ExtDateTimeField
---------------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtDateTimeField

    .. image:: /images/ui-example/datetimefield.png

Является потомком ``ExtDateField``. Обертка ``Ext.ux.form.DateTimeField``

13) ExtAdvTimeField
--------------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtAdvTimeField

    .. image:: /images/ui-example/advtime.png

Является потомком ``BaseExtField`` и аналогом ``ExtTimeField``. Обертка ``Ext.ux.form.AdvTimeField``

