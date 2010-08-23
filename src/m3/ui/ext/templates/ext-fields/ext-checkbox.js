new Ext.form.Checkbox({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	{% if component.checked %} ,checked: true {% endif %}
	{% if component.box_label %} ,boxLabel: '{{ component.box_label }}' {% endif %}
})