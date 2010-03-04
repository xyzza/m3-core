new Ext.grid.GridPanel({
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
})