new Ext.Toolbar({
	'id': '{{ component.client_id }}',
    items: [ {{ component.t_render_items|safe }} ]
})