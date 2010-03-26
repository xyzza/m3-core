new Ext.data.JsonStore({
	id: '{{ component.client_id }}'
	,url: '{{ component.url }}'
	{% if component.auto_load %} ,autoLoad: true {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
})