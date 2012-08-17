.. _ExtCheckBox::

ExtCheckBox
-----------

    .. autoclass:: m3.ui.ext.fields.simple.ExtCheckBox

Является потомком ``BaseExtField``. Обертка `Ext.form.Checkbox <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.form.Checkbox>`_

Атрибут ``checked`` - признак того, что значение выбрано.
Атрибут ``box_label`` - текст рядом с полем выбора значения. Пример: ::

    field = ExtCheckBox(anchor='100%', checked=True, box_label=u'Значение выбрано потому, что checked = True')

Иллюстрация к примеру:

    .. image:: /images/ui-example/checkbox.png
