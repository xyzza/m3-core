new Ext.Toolbar({

	'id': '{{ component.client_id }}',
    items: [ {{ component.render_items|safe }} ]

})