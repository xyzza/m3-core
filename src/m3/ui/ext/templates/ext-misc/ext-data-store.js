new Ext.data.Store({
	id: '{{ component.client_id }}',
	reader: new Ext.data.ArrayReader({}, 
	[{{ component.render_fields|safe }}]),
	data: [{{ component.render_data|safe }}]
})