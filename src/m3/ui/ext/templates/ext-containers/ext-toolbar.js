new Ext.Toolbar({
	'id': '{{ component.client_id }}'
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
    ,items: [ {{ component.t_render_items|safe }} ]
})