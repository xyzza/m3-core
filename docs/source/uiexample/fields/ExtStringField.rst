.. _ExtStringField::

ExtStringField
--------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtStringField

    .. image:: /images/ui-example/string_field.png

Является потомком ``BaseExtField``. Обертка `Ext.form.TextField <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.TextField>`_.

Атрибут ``input_mask`` - задает маску ввода. Пример: ::

    field = ExtStringField(anchor='100%', input_mask="(###)###-##-##")

Иллюстрация:

    .. image:: /images/ui-example/input_mask.png