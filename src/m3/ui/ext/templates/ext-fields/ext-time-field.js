new Ext.form.TimeField({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}

	{% if component.format %} ,format: "{{ component.format }}" {% endif %}
	{% if not component.allow_blank %} ,allowBlank: false {% endif %}
	{% if component.max_value %} ,maxValue: "{{ component.max_value }}" {% endif %}
	{% if component.min_value %} ,minValue: "{{ component.min_value }}" {% endif %}
	
	{% if component.increment %} ,increment: {{ component.increment }} {% endif %}
})