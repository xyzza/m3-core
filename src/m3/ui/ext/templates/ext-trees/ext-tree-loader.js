new Ext.tree.TreeLoader({
	{% if component.url %}
	dataUrl: '{{ component.url|safe }}'
	{% endif %}
})