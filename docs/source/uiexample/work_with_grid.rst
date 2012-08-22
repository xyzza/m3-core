Работа с таблицами (гридами)
============================

ExtGrid
-------

    .. autoclass:: m3.ui.ext.containers.grids.ExtGrid

    .. image:: /images/ui-example/extgridexample.png

У экземпляров грида имеется атрибут ``editor``, в зависимости от значения получаем обертку ``Ext.m3.GridPanel(False)``
или ``Ext.m3.EditorGridPanel(True)``. В зависимости от значения атрибута ``editor``, некоторые атрибуты могут не действовать.

Флаг ``load_mask``, указывает будет ли использоваться обьект маскирования при загрузке данных в грид.

    .. image:: /images/ui-example/loadmask.png

Атрибут ``click_to_edit``, указывает сколько раз необходимо кликнуть на строке, чтобы произошло событие ``dbclick`` (по
умолчания 2 раза).

Атрибуты ``drag_drop`` и ``drag_drop_group``, отвечают за присутствие функционала Drag&Drop.

Свойство ``sm`` задает модель выбора для грида(`Ext.grid.RowSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.RowSelectionModel>`_,
`Ext.grid.CheckboxSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.CheckboxSelectionModel>`_,
`Ext.grid.CellSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.CellSelectionModel>`_). В m3 реализованы:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridCheckBoxSelModel

    .. image:: /images/ui-example/checkboxselmodel_new.png

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridRowSelModel

    .. image:: /images/ui-example/rowselmodel_new.png

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridCellSelModel

    .. image:: /images/ui-example/cellselmodel_new.png

В атрибуте ``plugins``, хранится список плагинов, которые можно использовать для грида.
Например, ``Ext.ux.grid.GridHeaderFilters`` колоночная фильтрация: ::

    grid = ExtGrid(title = u'Произвольный грид', layout = 'fit')
    first_name_column = ExtGridColumn(header=u'Имя', data_index='fname')
    second_name_column = ExtGridColumn(header=u'Фамилия', data_index='lname')
    adress_column = ExtGridColumn(header=u'Адрес', data_index='adress')
    check_column = ExtGridCheckColumn(header=u'Колонка - флаг', data_index='flag')
    self.plugins.append('new Ext.ux.grid.GridHeaderFilters()')
    first_name_column.extra = {'filter': ExtStringField().render() }
        second_name_column.extra = {'filter': ExtStringField().render() }
        adress_column.extra = {'filter':ExtStringField().render()}

        grid.columns.extend([
            first_name_column,
            second_name_column,
            adress_column,
            check_column
        ])

    grid.plugins.extend(['new Ext.ux.grid.GridHeaderFilters()'])
    store = ExtJsonStore(url='ui/data_for_grid', auto_load=True, total_property='total', root='rows')
        grid.store = store

Иллюстрация:
    .. image:: /images/ui-example/gridheaderfilters_new.png

Свойство ``cm`` задает модель колонок. В m3 реализованы:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridDefaultColumnModel

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridLockingColumnModel

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridLockingHeaderGroupColumnModel

В классе присутствуют следующие методы добавления колонок:

    *   ``add_column`` - стандартная ``ExtGridColumn`` (`Ext.grid.ColumnView <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.Column>`_)
    *   ``add_bool_column`` - булева колонка ``ExtGridBooleanColumn`` (`Ext.grid.BooleanColumn <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.BooleanColumn>`_).
        Любое ненулевое значение, переданное в ячейку из этой колонки, будет преобразовано в **true**, а нулевые в **false**.
        Пример: ::

            grid = ExtGrid()
            ...
            grid.add_column(header=u'Имя', data_index = 'fname')
            grid.add_column(header=u'Фамилия', data_index = 'lname')
            grid.add_column(header=u'Адрес', data_index = 'adress')
            grid.add_bool_column(header=u'Колонка - флаг', data_index='flag')
            ...
            grid.set_store(ExtDataStore([[1,u'Юрий', u'Кофтун',u'пр. Мира', 'abc'],
                                             [2,u'Анатоле', u'Кожемякин',u'пл. Земля ', 1],
                                             [3,u'Анатоле', u'Кожемякин',u'пл. Земля ', 0],
                                             [4,u'Анатоле', u'Кожемякин',u'пл. Земля ', ''],
                                             [5,u'Анатоле', u'Кожемякин',u'пл. Земля ', True],
                                             [6,u'Анатоле', u'Кожемякин',u'пл. Земля ', False],
                                             ]
                                            ))

        Вот, что получится:

            .. image:: /images/ui-example/boolcolumn_new.png

    *   ``add_check_column`` - колонка для выбора значений ``ExtGridCheckColumn``. Аналогично предыдущему, только вместо
        **true** и **false**, мы увидим следующее:

            .. image:: /images/ui-example/checkcolumn_new.png

    *   ``add_number_column`` - числовая колонка ``ExtGridNumberColumn`` (`Ext.grid.NumberColumnView <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.NumberColumn>`_).
    *   ``add_date_column`` - колонка с датой ``ExtGridDataColumn`` (`Ext.grid.DateColumnView source <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.DateColumn>`_).
    *   ``add_banded_column`` - обьединенная ячейка. Пример: ::

            grid = ExtGrid()
            grid.add_column(header=u'Имя', data_index = 'fname')
            grid.add_column(header=u'Фамилия', data_index = 'lname')
            grid.add_column(header=u'Адрес', data_index = 'adress')
            grid.add_check_column(header=u'Колонка - флаг', data_index='flag')
            grid.set_store(ExtDataStore([[1,u'Юрий', u'Кофтун',u'пр. Мира', 'abc'],
                                 [2,u'Анатоле', u'Кожемякин',u'пл. Земля ', 1],
                                 [3,u'Анатоле', u'Кожемякин',u'пл. Земля ', 0],
                                 [4,u'Анатоле', u'Кожемякин',u'пл. Земля ', ''],
                                 [5,u'Анатоле', u'Кожемякин',u'пл. Земля ', True],
                                 [6,u'Анатоле', u'Кожемякин',u'пл. Земля ', False],
                                 ]
                                ))

            # Бандитские колонки
            grid.add_banded_column(ExtGridColumn(header = u'Мегаколонка', align = 'center'), 0, 4)
            grid.add_banded_column(ExtGridColumn(header = u'Подколонка1', align = 'center'), 1, 2)
            grid.add_banded_column(ExtGridColumn(header = u'Подколонка2', align = 'center'), 1, 2)

        Иллюстрация

            .. image:: /images/ui-example/bandedcolumn_new.png

Свойство ``view``, содержит компоненты ``view`` для грида. Например:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridGroupingView

Пример кода: ::

    grid = ExtGrid(title = u'Произвольный грид', layout = 'fit')
    grid.add_column(header=u'Имя', data_index = 'fname')
    grid.add_column(header=u'Фамилия', data_index = 'lname')
    grid.add_column(header=u'Адрес', data_index = 'adress')
    grid.add_check_column(header=u'Колонка - флаг', data_index='flag')
    grid.view = ExtGridGroupingView(force_fit=True, group_text_template='{[values.rs[0].data["fname"]]}')
    reader = ExtJsonReader(total_property='total', root='rows')
    reader.set_fields('id', 'fname', 'lname', 'adress', 'flag')
    grid.set_store(ExtGroupingStore(total_property='total', root='rows', auto_load=True))
    grid.store.group_field = 'fname'
    grid.store.sort_info = 'fname'

    grid.store.url = 'ui/data_for_grid'
    grid.store.reader = reader

Иллюстрация для ``ExtGridGroupinView``:

    .. image:: /images/ui-example/groupinview_new.png

ObjectGrid
----------

    .. autoclass:: m3.ui.ext.panels.grids.ExtObjectGrid

    .. image:: /images/ui-example/objectgridexample.png

Является наследником ``ExtGrid``:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGrid

Содержит в себе ``ExtToolBar``, с кнопками **Добавить**, **Редактировать**, **Удалить**,
**Обновить**. Для отображения кнопок в ``ExtToolBar`` необходимо задать соответствующий ``URL`` или ``action``.
``URL`` имеет более высокий приоритет над ``action``. Для отображения кнопки

    * **Добавить**, указываем атрибут ``url_new`` или ``action_new``.
    * **Редактировать**, указываем атрибут ``url_edit`` или ``action_edit``
    * **Удалить**, указываем атрибут ``url_delete`` или ``action_delete``
    * **Обновить**, указываем атрибут ``url_data`` или ``action_data``

Атрибуты ``url_data``, ``action_data`` также формируют данные для отображения в гриде, если мы не используем локальное
хранилище ``Ext.data.Store``.

Также, если указаны перечисленные выше атрибуты, то появляется возможность выполнять операции по созданию, удалению и
редактированию записей использую контекстное меню ``ExtContextMenu``, обертку `Ext.menu.Menu <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.menu.Menu>`_.
Для этого необходимо навести курсор мыши на строку и нажать правую кнопку мыши.

    .. image:: /images/ui-example/contextmenurow_new.png

Если заданы атрибуты ``url_new`` или ``action_new``, то возможно добавлять записи в грид используя контекстное меню грида.
Для этого необходимо навести мышь на грид, но не на строку и щелкнуть правой кнопкой мыши.

    .. image:: /images/ui-example/contextmenugrid_new.png

Редактирование существующей записи также можно производить, использую двойной клик на строке. Обработчик данного события
задан в атрибуте ``dbclick_handler``.

По умолчанию ``ExtObjectGrid`` в качестве хранилища использует ``ExtJsonStore``, обертку ``ExtJS``
класса `Ext.data.JsonStore <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.JsonStore>`_. Однако существует
возможность использовать `ExtDataStore <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.Store-cfg-data>`_,
``ExtGroupingStore`` и ``ExtMultiGroupingStore``.

Грид также, содержит ``ExtPaggingBar``, который позволяет выполнять постраничную навигацию и отображает количество
записей указанных на странице и общее число записей. Для отображения необходимо, проследить, чтобы атрибут ``allow_paging``
был равен ``True`` (разрешена постраничная навигация), это значение является значением по-умолчанию.

Свойство ``limit`` указывает на количество записей, которые будут выводиться на страницу при постраничной
навигации.

ExtMultiGroupinGrid
-------------------

    .. autoclass:: m3.ui.ext.panels.grids.ExtMultiGroupinGrid

Является наследником ``ExtGrid``:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGrid

Имеет ``ExtToolBar``, с кнопками **Добавить**, **Удалить**, **Редактировать**, **Экспорт**. Для
отображения необходимо задать атрибуты ``action_new``, ``action_delete``, ``action_edit``, ``action_export`` (или ``URL``-ы),
имеющие более высокий приоритет.

Атрибут ``grouped`` содержит список имен полей группировки. По умолчанию это пустой список.

В качестве ``store`` используется ``ExtMultiGroupingStore``.

Атрибуты ``display_info`` и ``display_message``, отвечают за наличие информации о записях и формате этой информации соответственно.
Информация отображается в ``ExtToolBar``-е грида.

    .. image:: /images/ui-example/display_info.png

Атрибут ``near_limit`` содержит число соседних сверху и снизу элементов от видимой области. Обычно 25-50% от
объема буфера.

Атрибут ``buffer_size``, количество записей которые попадут в грид из запроса. Данная величина
должна быть больше, чем число соседних элементов + число видимых строк.