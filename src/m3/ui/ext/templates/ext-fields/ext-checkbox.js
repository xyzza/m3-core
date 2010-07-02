new Ext.form.Checkbox({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	{% if component.checked %} ,checked: true {% endif %}
})