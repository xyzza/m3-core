new Ext.grid.GridPanel({
	id: '{{ component.client_id }}',
    title: '{{ component.title }}',

    {% if component.title %}
    header: true,
    {% else %}
    header: false,
    {% endif %}
    
	store: {{ component.render_store|safe }},
	columns: [{{ component.render_columns|safe }}],
	stripeRows: true,
	height: 600,
	stateful: true,
	viewConfig: {forceFit: true}
	
	{%if component.show_banded_columns%}
		//Плагин обработки объединенных колонок
		,plugins: new Ext.ux.grid.ColumnHeaderGroup({
			rows: {{ component.render_banded_columns_list|safe }}
		})
	{%endif%}
})