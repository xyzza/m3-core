{# new Ext.tree.AsyncTreeNode -- нельзя использовать, так как работает не корректно с вложеной иерархией #} 
{
	'expanded': '{{ component.expanded|lower }}'
	{% if component.node_id %}
	,'id': '{{ component.node_id }}'
	{% endif %}
    
	{% for k, v in component.items.items %}
		,{{ k }}:'{{ v }}'	
	{%endfor%}
	
	{% if component.auto_check %}
		{% if component.has_children %}
		,'leaf': false
		{% else %}
		,'leaf': true
		{% endif %}
	{% endif %}
	
	{% if component.has_children %}
	,'children': {{ component.render_children|safe }}
	{% endif %}
}
