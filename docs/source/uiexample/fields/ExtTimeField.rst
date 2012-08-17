.. _ExtTimeField::

ExtTimeField
------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtTimeField

    .. image:: /images/ui-example/timefield.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TimeField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TimeField>`_

Атрибут ``format`` задает формат отображения времени
Атрибут ``increment`` задает временной интервал между значениями в выпадающем списке. Например на
иллюстрации выше, это значение равно 15 минутам.

Атрибуты ``max_value`` и ``min_value`` задают верхнюю и нижнюю границу для времени.