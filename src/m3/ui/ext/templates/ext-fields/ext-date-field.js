new Ext.form.DateField({
	{% include 'base-ext-ui.js'%}
	
	{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
	{% if component.read_only %} ,readOnly: true {% endif %}
	{% if component.format %} ,format: "{{ component.format }}" {% endif %}
	,allowBlank: {{ component.allow_blank|lower }}
	
	{% if component.t_render_listeners %}
		{# Прописываются имеющиеся обработчики #}
		,listeners:{
			{% for k, v in component.t_render_listeners.items %}
				'{{k}}': {{v}}
				{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
	{% endif %}

})