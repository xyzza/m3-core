new Ext.form.NumberField({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	
	,allowBlank: {{ component.allow_blank|lower }}
	{% if component.vtype %} ,vtype: '{{ component.vtype }}' {% endif %}	
	{% if component.mask_re %} ,maskRe: {{ component.mask_re }} {% endif %}
	
	{% if not component.allow_decimals %} ,allowDecimals: false {% endif %}
	{% if not component.allow_negative %} ,allowNegative: false {% endif %}
	{% if decimal_precision %} ,decimalPrecision: {{ component.decimal_precision }} {% endif %}
	{% if min_value %} ,minValue: {{ component.min_value }} {% endif %}
	{% if max_value %} ,maxValue: {{ component.max_value }} {% endif %}
	{% if min_text %} ,minText: '{{ component.min_text }}' {% endif %}
	{% if max_text %} ,maxText: '{{ component.max_text }}' {% endif %}
	{% if component.max_length %} ,maxLength: {{ component.max_length }} {% endif %}
})