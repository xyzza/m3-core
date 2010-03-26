new Ext.tree.TreeLoader({
	'id': '{{ component.client_id }}'
	{% if component.url %},dataUrl: '{{ component.url|safe }}'{% endif %}
})