new Ext.data.JsonStore({
	id: '{{ component.client_id }}',
	url: '{{ component.url }}',
	autoLoad: '{{ component.auto_load|lower }}',
	fields: [{{ component.render_fields|safe }}]
})