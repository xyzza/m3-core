.. _ExtDateField::


ExtDateField
------------


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