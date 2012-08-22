.. _different_example::

Различные примеры реализаций
============================

Всяческие реализации контролов вы можете найти в проекте `m3_rnd: <https://repos.med.bars-open.ru/m3-rnd/>`_

Форма выбора из справочника:

.. image:: /_static/form-select.png

Реализация этой формы::

	def dictionary_window(request):
	    window = ExtDictionaryWindow(title = u'Форма списка и выбора из \
	    	простого плоского справочника', mode=0)
	    window.init_grid_components()
	    window.width = 500
	    window.height = 400
	    window.maximizable = True
	    window.grid.add_column(header=u'Имя', data_index = 'fname')
	    window.grid.add_column(header=u'Фамилия', data_index = 'lname')
	    window.grid.add_column(header=u'Адрес', data_index = 'adress')
	    window.grid.set_store(ExtJsonStore(url='/ui/grid-json-store-data',
	                                       auto_load=True, total_property='total', root='rows'))

	    window.url_new_grid = '/ui/simple-window3'
	    window.url_edit_grid = '/ui/simple-window3'
	    window.url_delete_grid = '/ui/simple-window3'

	    window.grid.bottom_bar = ExtPagingBar()

	    return http.HttpResponse(window.get_script())

Произвольная таблица с фильтрами:

.. image:: /_static/form-filter.png

Реализация таблицы с фильтрами::

	def column_filter_grid(request):
	    '''
	    Пример таблицы с фильтром
	    '''
	    window = ExtEditWindow(title = u'Произвольная таблица c фильтром', layout = 'fit')

	    button = ExtButton(text = u'Закрыть')
	    button.handler = 'function(){Ext.getCmp("%s").close();}' % window.client_id
	    window.buttons.append(button)

	    grid = ExtGrid()
	    grid.columns.append(ExtGridColumn(header = u'Имя', data_index = 'fname'))
	    grid.columns.append(ExtGridColumn(header = u'Фамилия', data_index = 'lname'))
	    grid.add_column(header=u'Адрес', data_index = 'adress')
	    grid.set_store(ExtJsonStore(url='/ui/grid-json-store-data', auto_load=True,
	    	total_property='total', root='rows'))

	    for col in grid.columns:
	        if col.data_index == 'fname':
	            col.extra['filter'] = u'{xtype:"textfield", tooltip:"Имя", filterName:"fname"}'
	        if col.data_index == 'lname':
	            col.extra['filter'] = u'{xtype:"textfield", tooltip:"Фамилия", filterName:"lname"}'
	        if col.data_index == 'adress':
	            col.extra['filter'] = u'[{xtype:"textfield", tooltip:"Улица",  \
	            	filterName:"street"},{xtype:"textfield", tooltip:"Дом", filterName:"house"}]'
	    grid.plugins.append('new Ext.ux.grid.GridHeaderFilters()')
	    window.form = grid

	    return http.HttpResponse(window.get_script())