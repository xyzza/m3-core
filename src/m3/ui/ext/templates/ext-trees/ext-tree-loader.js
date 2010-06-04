new Ext.tree.TreeLoader({
	'id': '{{ component.client_id }}'
	,xtype:'treeloader'
	,baseParams: Ext.applyIf({},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
	{% if component.url %},dataUrl: '{{ component.url|safe }}'{% endif %}
})