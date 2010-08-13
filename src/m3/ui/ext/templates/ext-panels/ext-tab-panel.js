new Ext.TabPanel({
	{% include 'base-ext-ui.js'%}
	
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.title %} ,title: '{{ component.title }}' {% endif %}
	,activeTab:0
	,autoWidth: true
    {% if component.enable_tab_scroll %}
    ,enableTabScroll: true
    {% else %}
    ,enableTabScroll: false
    {% endif %}
	,items: [{{ component.t_render_items|safe }}]
})
