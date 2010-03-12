{# new Ext.tree.AsyncTreeNode -- нельзя использовать, так как работает не корректно с вложеной иерархией #} 
{
    'draggable': '{{ component.draggable|lower }}'
	,'expanded': '{{ component.expanded|lower }}'
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
