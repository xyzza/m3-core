new Ext.data.Store({
	id: '{{ component.client_id }}'
	,reader: new Ext.data.ArrayReader({}, 
		[{{ component.t_render_fields|safe }}]
	)
	,data: [{{ component.t_render_data|safe }}]
})