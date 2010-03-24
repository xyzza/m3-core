new Ext.Panel({
	id: '{{ component.client_id }}',
	title:'{{ component.title }}'
	{% if component.width %}, width:{{ component.width }} {% endif %}
	{% if component.height %}, height: {{ component.height }} {% endif %}
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	, padding: '{{ component.padding }}'
	, layout: '{{ component.layout }}'
	, items: [{{ component.render_items|safe }}]
})