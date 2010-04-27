new Ext.TabPanel({
	{% include 'base-ext-ui.js'%}
	
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.title %} ,title: '{{ component.title }}' {% endif %}
	,activeTab:0
	,autoWidth: true
	,items: [{{ component.t_render_items|safe }}]
})
