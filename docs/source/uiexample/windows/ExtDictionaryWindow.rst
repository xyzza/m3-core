.. _ExtDictionaryWindow::

ExtDictionaryWindow
--------------------

    .. autoclass:: m3.ui.ext.windows.complex.ExtDictionaryWindow

    .. image:: /images/ui-example/dict_win.png

Является потомком ``BaseExtWindow``.

Окно может содержать внутри дерево и грид.

Пример работы: ::

    window = ExtDictionaryWindow(title = u'Форма списка и выбора из простого плоского справочника', mode=0)
    window.init_grid_components()
    window.width = 500
    window.height = 400
    window.maximizable = True
    window.grid.add_column(header=u'Имя', data_index = 'fname')
    window.grid.add_column(header=u'Фамилия', data_index = 'lname')
    window.grid.add_column(header=u'Адрес', data_index = 'adress')
    window.grid.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=True, total_property='total', root='rows'))
    window.url_new_grid = '/ui/simple-window3'
    window.url_edit_grid = '/ui/simple-window3'
    window.url_delete_grid = '/ui/simple-window3'