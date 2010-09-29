new Ext.form.DateField({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	
	{% if component.format %} ,format: "{{ component.format }}" {% endif %}
	,allowBlank: {{ component.allow_blank|lower }}
	
	{% if component.t_render_listeners %}
		{# Прописываются имеющиеся обработчики #}
		,listeners:{
			{% for k, v in component.t_render_listeners.items %}
				'{{k}}': {{v|safe}}
				{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
	{% endif %}

})