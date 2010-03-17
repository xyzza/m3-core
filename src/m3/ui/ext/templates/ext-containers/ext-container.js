new Ext.Container({
	id: '{{ component.client_id }}',
	width: '{{ component.width }}',
	layout: '{{ component.layout }}',
	items: [{{ component.render_items|safe }}]
})