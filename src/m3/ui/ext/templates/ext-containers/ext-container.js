new Ext.Container({
	id: '{{ component.client_id }}'
	, width: '{{ component.width }}'
	, layout: '{{ component.layout }}'
	 {% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	, items: [{{ component.t_render_items|safe }}]
})