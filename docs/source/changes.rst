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

* Добавлены иконки питоновских пакетов, питоновских модулей и модулей js в `m3/helpers/icons.py`. У всех иконок в сss файле проставлен признак ``important!`` - таким образом иконку переопределить нельзя. 

* В модуль `m3/helpers/loader.py` добавились функции: 
    
	.. autofunction:: m3.helpers.loader.read_simple_CSV_dict_file
	.. autofunction:: m3.helpers.loader.read_simple_DBF_dict_file
	.. autofunction:: m3.helpers.loader.read_simple_xml_file

* CodeEditor.js (`m3/static/js/`) поддерживает подцветку ``css``, ``html``, ``js``, ``sql``.

* В модулях `m3/ui/actions/dicts/simple.py` и `m3/ui/actions/dicts/tree.py` добавляются в окно динамически атрибуты ``request`` и ``context``.

* В класс ``ActionController`` добавился метод ``find_action``:

	.. autoclass:: m3.ui.actions.ActionController
		:members: find_action
	
	А так же в класс ``ControllerCache`` добавился метод класса ``find_action``:
	
	.. autoclass:: m3.ui.actions.ControllerCache
		:members: find_action
		
	
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