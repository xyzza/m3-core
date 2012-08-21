.. _work_with_windows::

Работа с окнами
================

BaseExtWindow
-------------

    .. auotclass:: m3.ui.ext.windows.base.BaseExtWindow

    .. image:: /images/ui-example/baseExtWindow.png

Атрибут ``template_globals`` содержит строковое представление пути к файлу шаблона,
который будет отрендерен после основного.

Атрибуты ``width``, ``heigth`` - ширина и высота окна.

Атрибут ``title`` заголовок окна

    .. image:: /images/ui-example/win_title.png

Атрибут ``layout`` задает расположение компонентов на окне. Для детального ознакомления
используйте документацию `ExtJS <http://docs.sencha.com/ext-js/3-4/#!/api>`_.

Флаг ``modal`` признак модальности окна. Т.е. пока окно открыто, невозможно осуществить
доступ к другим окнам.

    .. image:: /images/ui-example/win_modal.png

На картинке видно, что задний фон окрасился в серый цвет.

Флаги ``maximized`` и ``minimized`` признаки того, что окно развернуто на весь экран или свернуто.

Флаги ``closable``, ``maximizable``, ``minimizable`` - управляют возможностью закрывать, разворачивать и
сворачивать окно соответственно.

Атрибут ``body_style`` атрибут который содержит css код стиля тела окна. По умолчанию: ::

    self.body_style = 'padding:5px'

Атрибут ``icon_cls`` - css класс для иконки в вершине окна.

Атрибуты ``top_bar``, ``bottom_bar`` и ``footer_bar`` задают toolbar-ы

    .. image:: /images/ui-example/win_tool_bars.png

Флаги ``draggable`` и ``resizable`` управляют возможностью перетаскивать и изменять
размер окна.

Атрибут ``parent_window_id`` содержит ссылку на родительское окно.

``keys`` список обработчиков на клавиши.

Атрибут ``auto_load`` признак автоматической загрузки содержимого после рендеринга.

Флаг ``hidden`` указывает на то, что окно рендерится скрытым и для его отображения
необходимо вызвать метод ``show``.

Метод ``find_by_name`` осуществляет поиск экземпляра во вложенных обьектах по
имени экземпляра.

Метод ``make_read_only`` динамическая смена атрибута ``read_only``.


BaseExtListWondow
-----------------

    .. autoclass:: m3.ui.ext.windows.lists.BaseExtListWindow

    .. image:: /images/ui-example/list_win.png

Является потомком ``BaseExtWindow``.

Содержит в себе ``ExtObjectGrid``.

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


ExtEditWindow
-------------

    .. autoclass:: m3.ui.ext.windows.edit_window.ExtEditWindow

Является потомком ``BaseExtWindow``.

Содержит свойство ``form``. А также ``data_url`` - адрес для загрузки данных формы.
Целесообразно использовать при редактировании записи из справочника.

    .. image:: /images/ui-example/edit_window.png



