.. _dict_example:

Пример приложения
==================

Требуется создать справочник автомобилей, с иерархией по маркам авто. Добавлением,
редактирование, удалением как марок, так и самих автомобилей.

Карточка марки включает в себя атрибуты:

* Код
* Наименование
* Страна производитель
* Логотип

Карточка автомобиля включает:

* Код
* Наименование
* Марка
* Тип авто: (седан, хэтчбэк, универсал, паркетник, внедорожник, микро)


Создание приложения
====================

Реализацию нашего учебного приложения начнем с создания Python пакета. Присвоим пакету имя
``cars_dict``.

Следующим шагом зарегистрируем наше приложения. Для этого добавим имя ``cars_dict`` в кортеж
``INSTALLED_APPS``, который расположен в файле настроек Django ``settings.py``.

После сформируем каркас нашего приложения. Для этого внутри директории ``cars_dict``, создадим несколько файлов,
а именно ``app_meta.py``, ``models.py``, ``actions.py``, ``ui.py``. По мимо перечисленных, в этой директории,
по определению пакета Python, будет также находиться файл ``__init__.py``.

Описания моделей
=================

Нам необходимо описать две модели: "Карточка марки", "Карточка авто".

Для этого воспользуемся стандартными инструментами Django, а именно создадим классы-потомки класса ``django.db.models.Model``.

Код: ::

    from django.db import models

    from m3.core.json import json_encode

    class MarkCard(models.Model):
        """
        Карточка марки автомобиля
        """

        # Код марки
        code = models.PositiveIntegerField()

        # Наименование
        name = models.CharField(max_length=150)

        # Страна производитель
        country = models.CharField(max_length=150)

        # Ссылка на родителя
        parent = models.ForeignKey('MarkCard', blank=True, null=True)

        # Логотип
        logo = models.ImageField(upload_to='/uploads')


    class AutoCard(models.Model):
        """
        Карточка автомобиля
        """

        AUTO_TYPE = (
            (1, u'Седан'),
            (2, u'Хэтчбек'),
            (3, u'Универсал'),
            (4, u'Паркетник'),
            (5, u'Внедорожник'),
            (6, u'Микро')
        )

        # Код автомобиля
        code = models.PositiveIntegerField()

        # Наименование авто
        name = models.CharField(max_length=150)

        # Марка авто
        parent = models.ForeignKey(MarkCard)

        # Тип кузова
        type = models.SmallIntegerField(choices=AUTO_TYPE)

        @json_encode
        def verbose_type(self):
            # Убогая реализация. Необходимо было AUTO_TYPE, реализовать в виде словаря.
            return self.AUTO_TYPE[self.type - 1][1]

Описание некоторых ui-компонент
================================

После того как модели описаны, перейдем к описанию некоторых ui-компонент. Для этого откроем файл ``ui.py``.
Здесь мы реализуем два класса-окна. Первое для добавления/редактирования марки авто, второе для добавления/редактирования
карточки автомобиля.

Реализация первого окна: ::

    class EditNodeWindow(GearEditWindow):
        """
        Окно добавления/редактирования марки авто
        """

        def __init__(self, create_new = False, *args, **kwargs):
            super(EditNodeWindow, self).__init__(*args, **kwargs)

            self.frozen_size(600, 200)

            self.title = u'Марка авто'

            self.field_code = ExtStringField(label=u'Код', name='code', anchor='100%',
                allow_blank=False)
            self.field_name = ExtStringField(label=u'Наименование', name='name', anchor='100%',
                allow_blank=False)
            self.field_country = ExtStringField(label=u'Страна производитель', name='country', anchor='100%',
                allow_blank=False)
            self.field_logo = ExtImageUploadField(label=u'Лого', anchor='100%', name='logo')
            self.field_parent_id = ExtHiddenField(name='parent_id')
            self.field_id = ExtHiddenField(name='id')

            self.form.items.extend([
                self.field_code,
                self.field_name,
                self.field_country,
                self.field_logo,
                self.field_parent_id,
                self.field_id
            ])

В основу нашего класса ляжет класс ``GearEditWindow``, описанный в платформе M3. Мы всего лишь переопределим конструктор.
В конструкторе зададим атрибуты-поля, данного окна. ::

    self.field_code = ExtStringField(label=u'Код', name='code', anchor='100%',
                    allow_blank=False)
    self.field_name = ExtStringField(label=u'Наименование', name='name', anchor='100%',
                    allow_blank=False)
    self.field_country = ExtStringField(label=u'Страна производитель', name='country', anchor='100%',
                    allow_blank=False)
    self.field_logo = ExtImageUploadField(label=u'Лого', anchor='100%', name='logo')
    self.field_parent_id = ExtHiddenField(name='parent_id')
    self.field_id = ExtHiddenField(name='id')

Нетрудно найти соответствие между полями модели и полями на форме. В данном месте важно отметить, что у полей атрибут ``name``
должен совпадать с названием поля модели, это необходимо для того чтобы не писать велосипепедов, а использовать средства
реализованные в самой M3.

Вот первое окно:

    .. image:: images/dict-example/first-win.png

Реализация второго окна: ::

    class EditWindow(GearEditWindow):
        """
        """

        def __init__(self, create_new = False, *args, **kwargs):
            super(EditWindow, self).__init__(*args, **kwargs)

            self.frozen_size(600, 200)

            self.title = u'Карта авто'

            self.field_code = ExtStringField(label=u'Код', name='code', anchor='100%', allow_blank=False)
            self.field_name = ExtStringField(label=u'Наименование', name='name', anchor='100%', allow_blank=False)
            self.field_type = ExtComboBox(label=u'Тип кузова', display_field='type', name='type'
                ,anchor='100%', editable=False, value_field = 'id', allow_blank=False)

            self.field_type.store = ExtDataStore(data=models.AutoCard.AUTO_TYPE)
            self.field_type.trigger_action = BaseExtTriggerField.ALL

            self.form.items.extend([
                self.field_code,
                self.field_name,
                self.field_type,
                ExtHiddenField(name='parent_id')
            ])

Здесь все тоже самое. Просто создаем поля и добавляем их на форму.

Второе окно:

    .. image:: images/dict-example/second-win.png

Описание пака
==============

Здесь все ещё проще. Создаем потомка класса ``BaseTreeDictionaryModelActions``: ::

    from m3.ui.actions.dicts.tree import BaseTreeDictionaryModelActions

    import models
    import ui

    class CarsDictionaryActions(BaseTreeDictionaryModelActions):
        """
        """

        title = u'Авто справочник'

        url = r'/cars'

        tree_model = models.MarkCard
        tree_columns = [('name', u'Наименование марки'), ('country', u'Страна')]

        list_model = models.AutoCard
        list_columns = [('name', u'Наименование авто'), ('verbose_type', u'Тип кузова')]

        edit_node_window = ui.EditNodeWindow
        edit_window = ui.EditWindow

Посмотрим на внешний вид окна, а после приступим к описанию.

    .. image:: images/dict-example/main-win.png

В окне присутствуют два грида. Левый грид, отвечает модели "Карта марки". Для того, чтобы указать паку на это зададим
``tree_model = models.MarkCard``, а также колонки из модели, которые мы хотим отобразить в гриде.

С правым гридом вспе происходит по аналогии. Единственное исключение это колонка "Тип кузова". Здесь в качестве значения мы
будем брать, результат метода ``verbose_type``. Сам метод в определении модели, должен быть обернут в декоратор
``json_encode``.

Далее указываем паку на окна редактирования записей в обоих гридах. Эти окна мы описали в предыдущем пункте.

Метанастройки приложения
=========================

Последний пункт описание метанастроек приложения. Описания хранятся в файле ``app_meta.py``.

В первую очередь создадим экземпляр контроллера: ::

    cars_dictionary_controller = ActionController(url='/cars_dictionary')

Далее определим ``view``. Все стандартно как в Django. Внутри ``view`` производим вызов метода
``process_request`` экземпляра контроллера: ::

    def cars_dictionary_view(request):
        """
        """

        return cars_dictionary_controller.process_request(request)

Далее зарегистрируем ``URL``, по которому будет происходить обращение к нашему приложению: ::

    def register_urlpatterns():
        """
        Регистрация конфигурации урлов для приложения
        """

        return urls.defaults.patterns('',
            (r'^cars_dictionary/', cars_dictionary_view))

Для работоспособности данного кода необходимо убедиться, что в файле ``urls.py``, присутствуют следующие строки: ::

    #===============================================================================
    # собираем шаблоны урлов из app_meta подключенных приложений
    # пример работы с этой хренью в mis/poly/dicts/app_meta.py (функция register_urlpatterns)
    #===============================================================================
    urlpatterns += urls.get_app_urlpatterns()

Теперь зарегистрируем наш пак в контроллере: ::

    def register_actions():
        cars_dictionary_controller.packs.extend([
            actions.CarsDictionaryActions
        ])

И отобразим значок в меня "ПУСК" для запуска приложения: ::

    main_group = app_ui.DesktopLaunchGroup(name=u'Справочники')

    main_group.subitems.extend([
        app_ui.DesktopShortcut(name=u'Справочник авто', pack=actions.CarsDictionaryActions)
    ])

    app_ui.DesktopLoader.add(get_metarole(metaroles.ADMIN), app_ui.DesktopLoader.START_MENU, main_group)

Приложение готово к работе.