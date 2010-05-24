new Ext.form.NumberField({
	{% include 'base-ext-ui.js'%}
	
	{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
	{% if component.read_only %} ,readOnly: true {% endif %}
	
	{% if not component.allow_decimals %} ,allowDecimals: false {% endif %}
	{% if not component.allow_negative %} ,allowNegative: false {% endif %}
	{% if decimal_precision %} ,decimalPrecision: {{ component.decimal_precision }} {% endif %}
	{% if min_value %} ,minValue: {{ component.min_value }} {% endif %}
	{% if max_value %} ,maxValue: {{ component.max_value }} {% endif %}
	{% if min_text %} ,minText: '{{ component.min_text }}' {% endif %}
	{% if max_text %} ,maxText: '{{ component.max_text }}' {% endif %}
	{% if component.max_length %} ,maxLength: {{ component.max_length }} {% endif %}
})