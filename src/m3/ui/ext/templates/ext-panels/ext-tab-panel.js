new Ext.TabPanel({
	title:'{{component.title}}',
	activeTab:0,
	autoWidth: true,
	items: [{{ component.render_items|safe }}]
})
