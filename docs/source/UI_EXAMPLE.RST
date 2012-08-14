.. _ui_example::

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
