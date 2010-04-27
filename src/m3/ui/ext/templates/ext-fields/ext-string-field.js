new Ext.form.TextField({
	{% include 'base-ext-ui.js'%}
	
	{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
	{% if component.read_only %} ,readOnly: true {% endif %}
	
	{% if component.empty_text %} ,emptyText: '{{ component.empty_text }}' {% endif %}
	,allowBlank: {{ component.allow_blank|lower }}
	{% if component.input_type %} ,inputType: '{{ component.input_type }}' {% endif %}
	{% if component.min_length %} ,minLength: {{ component.min_length }} {% endif %}
	{% if component.max_length %} ,maxLength: {{ component.max_length }} {% endif %}
	{% if component.regex %} ,regex: '{{ component.regex }}' {% endif %}
	{% if component.min_length_text %} ,minLengthText: '{{ component.min_length_text }}' {% endif %}
	{% if component.max_length_text %} ,maxLengthText: '{{ component.max_length_text }}' {% endif %}
	{% if component.regex_text %} ,regexText: '{{ component.regex_text }}' {% endif %}
	{% if component.vtype %} ,vtype: '{{ component.vtype }}' {% endif %}	
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
