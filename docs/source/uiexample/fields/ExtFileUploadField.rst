.. _ExtFileUploadField::

ExtFileUploadField
------------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtFileUploadField

Является потомком ``BaseExtField``. Является оберткой ``Ext.ux.form.FileUploadField``.

Атрибут ``file_url`` задает URL, по которому расположен выбранный файл.

Атрибут ``possible_file_extension`` - кортеж допустимых расширений для файла. Например: ::

    possible_file_extensions = ('png', 'jpeg', 'gif', 'bmp')

Иллюстрация:

    .. image:: /images/ui-example/file_upload_field.png