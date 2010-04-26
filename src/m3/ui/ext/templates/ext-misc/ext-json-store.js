{# id устанавливать нельзя, так как оно перекрывает idProperty#}
new Ext.data.JsonStore({
	url: '{{ component.url }}'
	,baseParams: {
		start: {{ component.start }},
		limit: {{ component.limit }}
	}
	,idProperty: 'id'
	{% if component.root %} ,root: '{{ component.root }}' {% endif %}
	{% if component.total_property %} ,totalProperty: '{{ component.total_property }}' {% endif %}
	{% if component.auto_load %} ,autoLoad: true {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
})