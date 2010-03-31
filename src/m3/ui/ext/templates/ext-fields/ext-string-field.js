new Ext.form.TextField({
	id: '{{ component.client_id }}'
	{% if component.disabled %} ,disabled: true {% endif %}
	{% if component.hidden %} ,hidden: true {% endif %}
	{% if component.width %} ,width: {{ component.width }} {% endif %}
	{% if component.height %} ,height: {{ component.height }} {% endif %}
	{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
	{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
	{% if component.x %} ,x: {{ component.x }} {% endif %}
	{% if component.y %} ,y: {{ component.y }} {% endif %}
	{% if component.region %} ,region: '{{ component.region }}' {% endif %}
	{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
	
	{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
	
	,allowBlank: {{ component.allow_blank|lower }}
	{% if component.input_type %} ,inputType: '{{ component.input_type }}' {% endif %}
	{% if component.min_length %} ,minLength: {{ component.min_length }} {% endif %}
	{% if component.max_length %} ,maxLength: {{ component.max_length }} {% endif %}
	{% if component.regex %} ,regex: '{{ component.regex }}' {% endif %}
	{% if component.min_length_text %} ,minLengthText: '{{ component.min_length_text }}' {% endif %}
	{% if component.max_length_text %} ,maxLengthText: '{{ component.max_length_text }}' {% endif %}
	{% if component.regex_text %} ,regexText: '{{ component.regex_text }}' {% endif %}
	{% if component.vtype %} ,vtype: '{{ component.vtype }}' {% endif %}	
})