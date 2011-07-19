new Ext.form.RadioGroup({
	{% include 'base-ext-ui.js'%}

	{% if component.label %} ,label: '{{ component.label }}' {% endif %}
	{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
	{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
	{% if component.columns %} ,columns: {{ component.columns }} {% endif %}
	,items: {{ component.t_render_items|safe }}
})