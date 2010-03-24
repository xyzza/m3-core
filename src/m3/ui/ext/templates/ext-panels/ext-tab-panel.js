new Ext.TabPanel({
	id: '{{ component.client_id }}',
	title:'{{component.title}}'
	, activeTab:0
	, autoWidth: true
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	, items: [{{ component.render_tabs|safe }}]
})
