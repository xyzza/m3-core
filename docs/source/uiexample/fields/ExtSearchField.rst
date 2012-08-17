.. _ExtSearchField::

ExtSearchField
---------------

    .. autoclass:: m3.ui.ext.fields.complex.ExtSearchField

Является потомком ``BaseExtField``.

Важный атрибут ``component_for_search`` содержит ссылку на компонент
в котором осуществляется поиск.

Пример: ::

    tree = ExtTree(url='/ui/base-tree-data') # -- для дерева, подгружаемого с сервера
    tree.add_column(header=u'Имя', data_index = 'fname', width=140)
    tree.add_column(header=u'Фамилия', data_index = 'lname', width=140)
    tree.add_column(header=u'Адрес', data_index = 'adress', width=140)
    tree.add_number_column(header=u'Зп', data_index = 'nc', width=60)
    tree.add_date_column(header=u'Др', data_index = 'dc', width=60)
    tree.add_bool_column(header=u'Муж?',
                             data_index = 'bc',
                             text_false = u'Нет',
                             text_true = u'Да',
                             width=50)

    search = ExtSearchField(component_for_search = tree, empty_text=u'Поиск')

    search_other = ExtSearchField(component_for_search = tree, empty_text=u'Другой поиск')
    menu = ExtContextMenu(style = dict(overflow='visible'))
    menu.items.append(search_other)


    toolbar = ExtToolBar()
    toolbar.items.append(search)
    toolbar.add_fill()
    toolbar.add_menu(text=u'Поиск',menu=menu)

В этом случае создается два ``ExtSearchField``. Один из них помещён на ``ExtToolbar``,
а другой в ``ExtContextMenu``. Компонентом для поиска ``component_for_search`` является дерево.

    .. image:: /images/ui-example/search_field_example.png