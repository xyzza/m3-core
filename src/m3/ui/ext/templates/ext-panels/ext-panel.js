new Ext.Panel({
	title:'{{ component.title }}',
	{% if component.width %} width:{{ component.width }}, {% endif %}
	{% if component.height %} height: {{ component.height }}, {% endif %}
	padding: '{{ component.padding }}',
	layout: '{{ component.layout }}',
	items: [{{ component.render_items|safe }}]
})