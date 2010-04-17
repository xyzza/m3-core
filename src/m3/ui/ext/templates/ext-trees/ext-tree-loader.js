new Ext.tree.TreeLoader({
	'id': '{{ component.client_id }}'
	,xtype:'treeloader'
	{% if component.url %},dataUrl: '{{ component.url|safe }}'{% endif %}
})