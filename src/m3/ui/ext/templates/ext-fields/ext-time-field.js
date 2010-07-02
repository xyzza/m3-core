new Ext.form.TimeField({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}

	{% if component.format %} ,format: "{{ component.format }}" {% endif %}
	{% if not component.allow_blank %} ,allowBlank: false {% endif %}
	
	{% if component.increment %} ,increment: {{ component.increment }} {% endif %}
})