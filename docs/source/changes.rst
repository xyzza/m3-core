Release 1.0
=============================

* В базовое окно для линейного, иерархического и сомещенного справочника ``m3.ui.ext.windows.complex.ExtDictionaryWindow``
  добавлен режим множественного выбора.
* В класс ``m3.ui.ext.panels.grids.ExtMultiGroupinGrid`` добавлен атрибут ``header_style`` -- стиль заголовка колонки.
  А также метод ``render_base_config``.
* В ``m3.ui.ext.misc.store.ExtDataStore`` добавлена возможность прописывать в шаблоне даты.
* В методе ``render_base_config`` класса ``m3.ui.ext.fields.simple.ExtStringField`` реализовано экранирование значений с
  обратным слэшем.
* В модуль ``m3.ui.ext.containers.grids`` добавлены два класса:
    .. autoclass:: m3.ui.ext.containers.grids.ExtLiveGridCheckBoxSelModel
    .. autoclass:: m3.ui.ext.containers.grids.ExtLiveGridRowSelModel
* В класс ``m3.ui.ext.containers.forms.ExtForm`` добавлен метод ``try_to_list``.
* В класс ``m3.ui.ext.containers.forms.ExtPanel`` добавлен атрибут ``title_collapse``. Атрибут указывает нужно ли сворачивать
  панель при щелчке на заголовке.
* В класс ``m3.ui.actions.dicts.tree.BaseTreeDictionaryActions`` добавлен метод ``get_default_action``, который возвращает
  экшн по-умолчанию.
* В класс ``m3.ui.actions.dicts.tree.BaseTreeDictionaryModelActions`` добавлена настройка ``list_drag_and_drop`` разрешающая
  перетаскивание элементов из грида в другие группы дерева.
* В класс ``m3.ui.actions.dicts.simple.BaseDictionaryActions`` добавлен метод ``get_default_action``, который возвращает
  экшн по-умолчанию.
* В класс ``m3.ui.actions.results.ActionRedirectResult`` добавлен атрибут ``context`` и метод ``prepare_request``.
* В метод ``convert_value`` класса ``m3.ui.actions.context.ActionContext`` добавлена проверка версии Python, т.к. в версиях
  ниже 2.7 в `Decimal` не поддерживается создание из `float`.
* В классе ``Action`` добавлена проверка прав в родительском элементе из экшена
* В класс ``m3.ui.app_ui.DesktopLauncher`` добавлен метод ``_set_default_handler``
* Добавлен модуль ``m3_tags``. Там описан темплейт таг, который возвращает URL экшена.
* В метод ``deleteOkHandler`` классa ``Ext.m3.ObjectGrid`` добавлена проверка на ошибки уровня приложения.
* В класс ``Ext.m3.MultiSelectField`` добавлен метод ``fireChangeEventOnDemand``, который имитирует поведение ``Ext.form.Field.onBlur()``.
* В класс ``Ext.ux.form.FileUploadField`` добавлены события ``change`` (отрабатывает, когда изменилось значение) и
  ``beforechange`` (срабатывает до изменения поля)
* В класс ``Ext.m3.EditWindow`` добавлен метод ``clearModificationFlag``, который отбрасывает признаки модифицированности формы.
* Для ``Ext.m3.AdvancedComboBox`` корректирована функция ``getWidth``, которая вычисляет ширину поля.
* В класс ``Ext.m3.AddrField`` добавлено событие ``change_corps``, которое срабатывает при изменение корпуса.
* В класс ``m3.helpers.datagrouping.RecordProxy`` добавлен атрибут ``grouped`` -- список атрибуто, по которым происходит
  группироровка
* В класс ``m3.helpers.datagrouping.GroupingRecordProvider`` добавлен атрибут ``detail_attrs_map`` -- словарь, определяющий
  дополнительные поля, которые добавляются в узловые записи, создаваемые самим провайдером.
* Добавлен контриб `setupenv`
* Добавлен контриб `prepare_env`
* Множественные исправления, которые можно увидеть выполнив, например, визуальное сравнение веток через TortoiseHG.

Release 0.92
=============================

* Добавлен ExtJs класс ``Ext.ux.PagingTreeNodeUI`` (`m3/static/m3/js/ext-extensions/PagingNodeUI.js`).
  Добавлено описание стилей в `m3/static/m3/css`
* Реализовано добавление/удаление пользовательского класса ``m3-grey-field`` после использования ``setReadOnly`` для
  ``Ext.form.Field`` и ``Ext.form.TriggerField``.
* В модуль ``m3.ui.actions.utils`` добавлена функция ``detect_related_fields``
    .. autofunction:: m3.ui.actions.utils.detect_related_fields
* В классе ``m3.ui.ext.base.BaseExtComponent`` поправлен метод ``_put_base_value``. Теперь возможно передавать даты.
* В класс ``m3.ui.ext.containers.trees.ExtTreeLoader`` добавлен атрибут ``ui_providers``.
* В класс ``m3.ui.ext.panels.grids.ExtMultiGroupinGrid`` добавлен атрибут ``display_message`` -- формат отображения
  информации о записях.
* Переделан M3 календарь.

Release 0.91
=============================

* В класс ``m3.ui.actions.packs.BaseDictionaryActions`` добавлен метод ``get_record``:
    .. autoclass:: m3.ui.actions.packs.BaseDictionaryActions
        :members: get_record
        :noindex:

    Данный метод переопределен в классе ``m3.ui.actions.packs.BaseEnumerateDictionary``
* В класс ``m3.ui.actions.tree_packs.BaseTreeDictionaryActions`` добавлен метод ``get_record``:
    .. autoclass:: m3.ui.actions.tree_packs.BaseTreeDictionaryActions
        :members: get_record
        :noindex:

    Данный метод переопределен в классе ``m3.ui.actions.tree_packs.BaseTreeDictionaryModelActions``.
* В класс ``m3.ui.actions.dicts.simple.BaseDictionaryActions`` добавлен метод ``get_record``:
    .. autoclass:: m3.ui.actions.dicts.simple.BaseDictionaryActions
        :members: get_record
        :noindex:

    Данный метод переопределен в классах ``m3.ui.actions.dicts.simple.BaseEnumerateDictionary`` и ``m3.ui.actions.dicts.simple.BaseDictionaryModelActions``.
* В класс ``m3.ui.actions.dicts.tree.BaseTreeDictionaryActions`` добавлен метод ``get_record``:
    .. autoclass:: m3.ui.actions.dicts.tree.BaseTreeDictionaryActions
        :members: get_record
        :noindex:

    Данный метод переопределен в классе ``m3.ui.actions.dicts.tree.BaseTreeDictionaryModelActions``.
* В класс ``m3.ui.ext.fields.base.BaseExtTriggerField`` добавлены атрибуты:
    ``fields`` - иные имена полей (кроме id и display_field), которые будут попадать в store
    ``list_width`` -  ширина выпадающего списка
    ``list_tpl`` - шаблон рендера выпадающего списка
    ``resizable`` - изменение ширины выпадающего списка
* В класс ``m3.ui.ext.fields.complex.ExtDictSelectField`` добавлено свойство ``record_value`` (значение, которое будет передано в store)
* В классе ``m3.ui.ext.misc.store.ExtDataStore`` поправлен метод ``t_render_fields``.
* Исправлено поведение ``Ext.ComboBox``, когда значения списка с ``value`` '' и 0 считаются идентичными
* В класс ``Ext.m3.EditWindow`` добавлено событие ``submitfailed``, которое генерируется при ошибке в момент сабмита формы
* В класс ``Ext.m3.AdvancedComboBox`` добавлен атрибут ``defaultRecord`` -- значение по-умолчанию
* В классе ``m3.contrib.m3_users.metaroles.MetaroleManager`` поправлен метод ``get_metarole``. Внесенные изменения необходимы
  для правильной работы ``DictSelectField`` в условии ``iSelectablePack``.

Release 0.9 (19.08.2011)
=============================

* ExtJs обновлен до версии 3.4.0

* MPTT обновлен до версии 0.4.2

* В `vendor` добавлен модуль для HTTP запросов `poster <http://pypi.python.org/pypi/poster/0.4>`_
* В `vendor` добавлен модуль `rope <http://rope.sourceforge.net/>`_
* В `vendor` добавлен модуль `sqlalchemy <http://www.sqlalchemy.org/>`_
   В связи с чем добавлена поддержка SQLAlchemy (создает подключение, 
   преобразует DDL во внутреннее объектное представление алхимии, создает мап объекты для моделей django)
  
  Классы ``m3/db/alchemy_wrapper.py``:
  
   .. autoclass:: m3.db.alchemy_wrapper.SQLAlchemyWrapper
   .. autoclass:: m3.db.alchemy_wrapper.ModelCollection
  
  Реализация провайдера данных для группировок с использованием alchemy, их классы:
  
  .. autoclass::  m3.helpers.datagrouping_alchemy.GroupingRecordSQLAlchemyProvider    
    
* Новые приложения:

 * Интеграционная шина:

  * m3.misc.ibus (В разработке);

  * m3.contrib.m3_ibus_client (В разработке).

 * :doc:`contrib/m3_query_builder`;

 * :doc:`report_generator/index` на базе OpenOffice;

* Дизайнер форм:

 * При редактировании файла добавлен автокомплит кода;

 * Добавлен выбор разных тем;

 * Исправления ``ExtAddrComponent`` для корректного создания компонента из дизайнера.
 
* Добавлен билдинг в `m3.misc` компонента `livegrid` (``ExtMultiGroupinGrid``) через файл `misc/build_livegrid.py`
 
* В `m3.contrib.audit` добавлено cтруктура данных аудита действий над ролями пользователей

* Добавлена поддержка  `select for update <https://coderanger.net/2011/01/select-for-update/>`_  в `m3.db` 
  
* Добавлен ExtJs класс  ``Ext.m3.BackgroundOperationProxy`` - 
  обеспечивающий интерфейс для опроса сервера с заданным интервалом.
  
  В связи с чем добавлен ``IBackgroundWorker`` в `m3/ui/actions/async.py`:
   .. autoclass:: m3.ui.actions.async.IBackgroundWorker
       :noindex:
  
  
  И ``BackgroundOperationBar`` и ``ExtProgressBar`` из `ui/ext/misc/background_operation.py`:
   .. autoclass:: m3.ui.ext.misc.background_operation.BackgroundOperationBar
   .. autoclass:: m3.ui.ext.misc.background_operation.ExtProgressBar
   
* Добавлен ExtJs класс ``Ext.m3.MultiSelectField`` - Контрол для выбора множества значений из справочника

 И серверная обертка:
   .. autoclass:: m3.ui.ext.fields.complex.ExtMultiSelectField

* Множественные исправления, которые можно увидеть выполнив, например, визуальное сравнение веток через TortoiseHG.

Release 0.8 (18.05.2011)
=============================
* Обновление ``Django`` с 1.2.3 до 1.3
* Обновление ``South`` с 0.7.2 до 0.7.3
* Добавилось приложение `m3/contrib/designer` (Дизайнер форм для m3)
* Добавилось приложение `m3/contrib/m3_docs`. В связи с чем добавилось приложение в static - `static/contrib/m3_docs`

* В файле `m3/contrib/m3_users/metaroles.py` в классе ``UserMetarole`` вложенные метароли строго должны быть типом ``UserMetarole``::

	self.included_metaroles = TypedList(type=UserMetarole)

* В генератор отчетов добавилась проверка, если не установлен JRE
* Класс ``M3JSONEncoder`` больше не серриализует protected/private атрибуты

* Добавлен модуль для описания врапперов над структурой элементов базы данных (таблиц и их полей) `m3/db/ddl.py`

* Добавлены иконки питоновских пакетов, питоновских модулей и модулей js в `m3/helpers/icons.py`. У всех иконок в сss файле проставлен признак ``!important`` - таким образом иконку переопределить нельзя. 

* В модуль `m3/helpers/loader.py` добавились функции: 
    
	.. autofunction:: m3.helpers.loader.read_simple_CSV_dict_file
	.. autofunction:: m3.helpers.loader.read_simple_DBF_dict_file
	.. autofunction:: m3.helpers.loader.read_simple_xml_file

* CodeEditor.js (`m3/static/js/`) поддерживает подцветку ``css``, ``html``, ``js``, ``sql``.

* В модулях `m3/ui/actions/dicts/simple.py` и `m3/ui/actions/dicts/tree.py` добавляются в окно динамически атрибуты ``request`` и ``context``.

* В класс ``ActionController`` добавился метод ``find_action``:

	.. autoclass:: m3.ui.actions.ActionController
		:members: find_action
		:noindex:
	
	А так же в класс ``ControllerCache`` добавился метод класса ``find_action``:
	
	.. autoclass:: m3.ui.actions.ControllerCache
		:members: find_action
		:noindex:
	
* В классе ``ActionContextDeclaration`` обязательно передовать в конструктор параметр ``type``. Добавился ``assert`` на проверку этого параметра. А также переписан метод ``json`` с использованием ``json.dumps``

* `m3/ui/ext/*` Убраны комментарии, которые хотелось когда-то использовать в дизайнере, который должен был строиться на базе аптаны. 

* Класс ``ExtToolBar`` включает подклассы ``Separator``, ``Spacer``, ``TextItem``. Классы ``ExtStaticToolBarItem`` и ``ExtTextToolBarItem`` теперь **deprecated**.

* Множественные исправления, которые можно увидеть выполнив, например, визуальное сравнение веток через TortoiseHG.

Release 0.7 (10.03.2011)
=============================

* Изменения для 0.7 ветки


Release 0.6 (29.11.2010)
=============================

* Изменения для 0.6 ветки