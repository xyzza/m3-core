new Ext.tree.TreeLoader({
	'id': '{{ component.client_id }}'
	,xtype:'treeloader'
	,baseParams: Ext.applyIf({
		{% for key,value in component.base_params.items %}
    			'{{ key }}': '{{ value}}'{% if not forloop.last %},{% endif %}			
    		{% endfor %}
	},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
	{% if component.url %},dataUrl: '{{ component.url|safe }}'{% endif %}
})