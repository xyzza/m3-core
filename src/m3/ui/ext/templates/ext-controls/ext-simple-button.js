new Ext.Button({
	text: "{{ component.text }}"
	{% if component.handler %}
		,handler: {{ component.render_handler|safe}}
	{% endif%}
})
