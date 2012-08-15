.. _uiexample::

Пример графических компонент
============================

Создадим окошко с ``TabPanel``. На первой вкладке расположим текстовое поле и два комбобокса.
Один из комбобоксов будет использовать удаленный стор.

Код самого окна: ::

    window = ExtEditWindow()
    window.title = u'Пример 1'
    window.layout = 'fit'

Далее расположим ``ExTabPanel``: ::

    tab_panel = ExtTabPanel(title = u'Form for window')

Займемся первой панелью: ::

    first_panel = tab_panel.add_tab(title = u'Панель №1`, height = 300, layout = 'form', padding=15)
    # Добавлили текстовое поле
    first_panel.items.append(ExtStringField(label = u'Имя', anchor = '100%'))
    # Первый комбобокс с локальным стором
    local_combo = ExtComboBox(label = u'Combo local',
                        display_field = 'type',
                        empty_text = 'choose',
                        editable = False,
                        trigger_action_all = True,
                        anchor = '100%')
    # Задаём локальный store
    store = ExtDataStore()
    # Задаём reader для store. Store не должен знать в каком формате приходят к нему данные.
    # Преобразованием пришедших данных в массив Record-ов занимается reader
    store.reader = ExtJsonReader()
    # Сами данные в формате Json
    store.data = [{'id': 1, 'type': u'М'}, {'id': 2, 'type': u'Ж'}]
    # Связываем первый комбобокс с локальным стором
    local_combo.set_store(store)

    # Второй комбобокс с удаленным стором
    remote_combo = ExtComboBox(label = u'Сombo remote', display_field = 'lname', empty_text = 'choose', anchor='100%')
    # Задаём удаленный store для второго комбобокса.
    remote_store.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto-load=True, total_property='total', root='rows'))

    # Располагаем оба комбобокса на панели
    first_panel.items.extend([local_combo, remote_combo])

Посмотрим на результат:

    .. image:: images/ui-example/example_first_tab.png

На второй вкладке расположим поле с датой ``ExtDateField``: ::

    second_panel = ExtPanel(title = u'Панель №2', height = 300, layout = 'form', padding = 15)
    second_panel.items.append(ExtDataField(label=u'Дата', anchor = '100%'))
    tab_panel.tabs.append(second_panel)

Так выглядит вторая вкладка:

    .. image:: images/ui-example/example_second_tab.png

На третьей вкладке расположим грид с двумя колонками: Имя и Фамилия: ::

    third_panel = ExtPanel(title = u'Grid', layout = 'fit')
    # Создаем экземпляр грида
    grid = ExtGrid()
    # Добавляем колонки
    grid.add_column(header=u'Имя', data_index = 'fname', width = 140, sortable = True)
    grid.add_column(header=u'Фамилия', data_index = 'lname', width = 140)
    # Устанавливаем store. По умолчанию он будет принимать данные в виде массивов
    grid.set_store(ExtDataStore([[1, u'М'], [2, u'Ж']]))

    # Располагаем грид на панели
    third_panel.items.append(grid)
    # Саму панельку добавляем на TabPanel
    tab_panel.tabs.append(third_panel)

Третья вкладка имеет вид:

    .. image:: images/ui-example/example_third_tab.png

На четвертой вкладке расположим fieldset и checkbox. При нажатии на checkbox будет происходить появления и
исчезание fieldset: ::

    person_field_set = ExtFieldSet(title=u'Физические лица', checkboxToggle = True)

    person_relation = ExtCheckBox(label = u'Родственники', name = 'person_relation')
    cont = ExtDictSelectField(label = u'Первый участник', url = '/ui/grid-json-store-data',
                              ask_before_deleting=False,
                              width = 200)
    # То, что видит пользователь
    cont.display_field = 'lname'
    # То, что отправляется на сервер при submit-е
    cont.value_field = 'id'
    cont.hide_trigger = False

    date_field = ExtDateField(format='d-m', label = 'datefield')

    person_relation_string_field = ExtStringField(label=u'Родственники2')

    center_person.items.extend([person_relation, person_relation_string_field, cont,
                                        date_field])

То, что получилось в результате:

    .. image:: images\ui-example\example_tab_4.png


Примеры гридов
===============

1) ExtGrid

    .. autoclass:: m3.ui.ext.containers.grids.ExtGrid

У экземпляров грида имеется атрибут ``editor``, в зависимости от значения получаем обертку ``Ext.m3.GridPanel(False)``
или ``Ext.m3.EditorGridPanel(True)``. В зависимости от значения атрибута ``editor``, некоторые атрибуты могут не действовать.

Флаг ``load_mask``, указывает будет ли использоваться обьект маскирования при загрузке данных в грид.

    .. image:: images/ui-example/loadmask.png

Атрибут ``click_to_edit``, указывает сколько раз необходимо кликнуть на строке, чтобы произошло событие ``dbclick``(по
умолчания 2 раза).

Атрибуты ``drag_drop`` и ``drag_drop_group``, отвечают за присутствие функционала Drag&Drop.

Свойство ``sm`` задает модель выбора для грида(`Ext.grid.RowSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.RowSelectionModel>`_,
`Ext.grid.CheckboxSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.CheckboxSelectionModel>`_,
`Ext.grid.CellSelectionModel <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.CellSelectionModel>`_). В m3 реализованы:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridCheckBoxSelModel

    .. image:: images/ui-example/checkboxselmodel.png

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridRowSelModel

    .. image:: images/ui-example/rowselmodel.png

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridCellSelModel

    .. image:: images/ui-example/cellselmodel.png

В атрибуте ``plugins``, хранится список плагинов, которые можно использовать для грида.
Например, ``Ext.ux.grid.GridHeaderFilters`` колоночная фильтрация: ::

    self.plugins.append('new Ext.ux.grid.GridHeaderFilters()')

Иллюстрация:
    .. image:: images/ui-example/gridheaderfilters.png

Свойство ``cm`` задает модель колонок. В m3 реализованы:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridDefaultColumnModel

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridLockingColumnModel

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridLockingHeaderGroupColumnModel

В классе присутствуют следующие методы добавления колонок:

    *   ``add_column`` - стандартная ``ExtGridColumn``(`Ext.grid.ColumnView <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.Column>`_)
    *   ``add_bool_column`` - булева колонка ``ExtGridBooleanColumn``(`Ext.grid.BooleanColumn <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.BooleanColumn>`_).
        Любое ненулевое значение, переданное в ячейку из этой колонки, будет преобразовано в **true**, а нулевые в **false**.
        Пример: ::

            grid = ExtGrid()
            ...
            grid.add_column(header=u'Имя', sortable=False, data_index='name')
            grid.add_column(header=u'Идентификатор', sortable=False, data_index='id')
            grid.add_bool_column(header=u'Флаг', data_index='flag')
            ...
            grid.store = ExtDataStore(data[(1, u'Вася', 'abc'), (2, u'Петя')])

        Вот, что получится:

            .. image:: images/ui-example/boolcolumn.png

    *   ``add_check_column`` - колонка для выбора значений ``ExtGridCheckColumn``. Аналогично предыдущему, только вместо
        **true** и **false**, мы увидим следующее:

            .. image:: images/ui-example/checkcolumn.png

    *   ``add_number_column`` - числовая колонка ``ExtGridNumberColumn``(`Ext.grid.NumberColumnView <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.NumberColumn>`_).
    *   ``add_date_column`` - колонка с датой ``ExtGridDataColumn``(`Ext.grid.DateColumnView source <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.grid.DateColumn>`_).
    *   ``add_banded_column`` - обьединенная ячейка. Пример: ::

            grid = ExtGrid()
            grid.add_column(header=u'Имя', data_index = 'fname')
            grid.add_column(header=u'Фамилия', data_index = 'lname')
            grid.add_column(header=u'Адрес', data_index = 'adress')
            grid.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=True, total_property='total', root='rows'))

            # Бандитские колонки
            grid.add_banded_column(ExtGridColumn(header = u'Мегаколонка', align = 'center'), 0, 3)
            grid.add_banded_column(ExtGridColumn(header = u'Подколонка1', align = 'center'), 1, 2)
            grid.add_banded_column(ExtGridColumn(header = u'Подколонка2', align = 'center'), 1, 1)

        Иллюстрация

            .. image:: images/ui-example/bandedcolumn.png

Свойство ``view``, содержит компоненты ``view`` для грида. Например: ::

    .. autoclass:: m3.ui.ext.containers.grids.ExtGridGroupingView

Иллюстрация для ``ExtGridGroupinView``:

    .. image:: images/ui-example/groupinview.png

2) ObjectGrid

    .. autoclass:: m3.ui.ext.panels.grids.ExtObjectGrid

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

Иллюстрация ``ExtToolBar`` в ``ExtObjectGrid``:

    .. image:: images/ui-example/toptoolbar.png

Также, если указаны перечисленные выше атрибуты, то появляется возможность выполнять операции по созданию, удалению и
редактированию записей использую контекстное меню ``ExtContextMenu``, обертку `Ext.menu.Menu <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.menu.Menu>`_.
Для этого необходимо навести курсор мыши на строку и нажать правую кнопку мыши.

    .. image:: images/ui-example/contextmenurow.png

Если заданы атрибуты ``url_new`` или ``action_new``, то возможно добавлять записи в грид используя контекстное меню грида.
Для этого необходимо навести мышь на грид, но не на строку и щелкнуть правой кнопкой мыши.

    .. image:: images/ui-example/contextmenugrid.png

Редактирование существующей записи также можно производить, использую двойной клик на строке. Обработчик данного события
задан в атрибуте ``dbclick_handler``.

По умолчанию ``ExtObjectGrid`` в качестве хранилища использует ``ExtJsonStore``, обертку ``ExtJS``
класса `Ext.data.JsonStore <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.JsonStore>`_. Однако существует
возможность использовать `ExtDataStore <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.Store-cfg-data>`_,
``ExtGroupingStore`` и ``ExtMultiGroupingStore``.

Грид также, содержит ``ExtPaggingBar``, который позволяет выполнять постраничную навигацию и отображает количество
записей указанных на странице и общее число записей. Для отображения необходимо, проследить, чтобы атрибут ``allow_paging``
был равен ``True``(разрешена постраничная навигация), это значение является значением по-умолчанию.

    .. image:: images/ui-example/Pagingbar.png

Свойство ``limit`` указывает на количество записей, которые будут выводиться на страницу при постраничной
навигации.

3) ExtMultiGroupinGrid

    .. autoclass:: m3.ui.ext.panels.grids.ExtMultiGroupinGrid

Является наследником ``ExtGrid``:

    .. autoclass:: m3.ui.ext.containers.grids.ExtGrid

Имеет ``ExtToolBar``, с кнопками **Добавить**, **Удалить**, **Редактировать**, **Экспорт**. Для
отображения необходимо задать атрибуты ``action_new``, ``action_delete``, ``action_edit``, ``action_export``(или ``URL``-ы),
имеющие более высокий приоритет.

Атрибут ``grouped`` содержит список имен полей группировки. По умолчанию это пустой список.

В качестве ``store`` используется ``ExtMultiGroupingStore``.

Атрибуты ``display_info`` и ``display_message``, отвечают за наличие информации о записях и формате этой информации соответственно.
Информация отображается в ``ExtToolBar``-е грида.

    .. image:: images/ui-example/display_info.png

Атрибут ``near_limit`` содержит число соседних сверху и снизу элементов от видимой области. Обычно 25-50% от
объема буфера.

Атрибут ``buffer_size``, количество записей которые попадут в грид из запроса. Данная величина
должна быть больше, чем число соседних элементов + число видимых строк.
