new Ext.Panel({
	title:'{{component.title}}',
	width:'{{component.width}}',
	items: [{{ component.render_items|safe }}]
})