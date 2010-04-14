new Ext.form.ComboBox({
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
	{% if component.max_height %} ,boxMaxHeight: {{ component.max_height }} {% endif %}
	{% if component.min_height %} ,boxMinHeight: {{ component.min_height }} {% endif %}
	{% if component.max_width %} ,boxMaxWidth: {{ component.max_width }} {% endif %}
	{% if component.min_width %} ,boxMinWidth: {{ component.min_width }} {% endif %}
	,allowBlank: {{ component.allow_blank|lower }}
	
	{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.name %} ,name: '{{ component.name }}' {% endif %}
	{% if component.value %} ,value: '{{ component.value }}' {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
	{% if component.read_only %} ,readOnly: true {% endif %}
	
	{% if component.empty_text%}, emptyText: '{{component.empty_text}}' {% endif %}
	{% if component.mode%}, mode: '{{component.mode}}' {% endif %}
	
	,store:{{component.t_render_store|safe}}
	{% if not component.editable%} ,editable: false {% endif %}
	{% if component.display_field %} ,displayField:'{{component.display_field}}' {% endif %}
	{% if component.value_field %} ,valueField:'{{component.value_field}}' {% endif %}
	{% if component.hidden_name %} ,hiddenName:'{{component.hidden_name}}' {% endif %}
	{% if component.hide_trigger %} ,hideTrigger: true {% endif %}
	{% if component.type_ahead %} ,typeAhead: true {% endif %}
	{% if component.trigger_action_all %} ,triggerAction: 'all' {%endif%}
	,loadingText: 'Загрузка...'
	{% if component.query_param %} ,queryParam: '{{component.query_param}}' {% endif %}
	{% if component.page_size %} ,pageSize: {{component.page_size}} {% endif %}
	{% if component.max_heigth_dropdown_list %} ,maxHeight: {{component.max_heigth_dropdown_list}} {% endif %}
	{% if component.min_chars %} ,minChars: {{component.min_chars}} {% endif %}
	,valueNotFoundText: 'Ничего не найдено'
	
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
