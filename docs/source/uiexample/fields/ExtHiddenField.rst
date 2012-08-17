.. _ExtHiddenField::

ExtHiddenField
---------------

    .. autoclass:: m3.ui.ext.fields.simple.ExtHiddenField

Является потомком ``BaseExtField``. Обертка `Ext.form.Hidden <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Hidden>`_

Атрибут ``type`` задает тип данного поля. Возможны два варианта ( ``ExtHiddenField.INT`` = 0 и ``ExtHiddenField.STRING`` = 1).
Обычно данное поле используют для хранения идентификатора обьекта. Его не нужно показывать пользователю, но
оно полезно при submit-е.