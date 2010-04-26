{# id устанавливать нельзя, так как оно перекрывает idProperty#}
new Ext.data.JsonStore({
	url: '{{ component.url }}'
	,baseParams: {
		start: {{ component.start }},
		limit: {{ component.limit }}
	}
	,idProperty: 'id'
	{% if component.auto_load %} ,autoLoad: true {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
})