{# id устанавливать нельзя, так как оно перекрывает idProperty#}
new Ext.data.JsonStore({
	url: '{{ component.url }}'
	,idProperty: 'pk'
	{% if component.auto_load %} ,autoLoad: true {% endif %}
	,fields: [{{ component.t_render_fields|safe }}]
})