(function(){
	
	var baseConfig = {
		{% include 'base-ext-ui.js'%}
		{% include 'base-ext-field-ui.js'%}
		
		,allowBlank: {{ component.allow_blank|lower }}	
		
		
		{% if component.empty_text%}, emptyText: '{{component.empty_text}}' {% endif %}
		{% if component.mode%}, mode: '{{component.mode}}' {% endif %}
		
		,store:{{component.t_render_store|safe}}
		{% if not component.editable%} ,editable: false {% endif %}
		{% if component.display_field %} ,displayField:'{{component.display_field}}' {% endif %}
		{% if component.value_field %} ,valueField:'{{component.value_field}}' {% endif %}
		{% if component.hidden_name %} ,hiddenName:'{{component.hidden_name}}' {% endif %}
		
		{% if component.type_ahead %} ,typeAhead: true {% endif %}
		{% if component.trigger_action_all %} ,triggerAction: 'all' {%endif%}
		,loadingText: 'Загрузка...'
		{% if component.query_param %} ,queryParam: '{{component.query_param}}' {% endif %}
		{% if component.page_size %} ,pageSize: {{component.page_size}} {% endif %}
		{% if component.max_heigth_dropdown_list %} ,maxHeight: {{component.max_heigth_dropdown_list}} {% endif %}
		{% if component.min_chars %} ,minChars: {{component.min_chars}} {% endif %}
		,valueNotFoundText: ''
		
		{% if component.t_render_listeners %}
			// Прописываются имеющиеся обработчики 
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					'{{k}}': {{v}}
					{% if not forloop.last %},{% endif %}
				{% endfor%}
			}
		{% endif %}
	}
	var params = {
		askBeforeDeleting: {{ component.ask_before_deleting|lower }}
		,actions: {
			actionSelectUrl: '{{ component.url }}'
			,actionEditUrl: '{{ component.edit_url }}'
			,actionContextJson: {% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}
		}
		,hideTrigger: {{ component.hide_trigger|lower }}
		,defaultText:'{{ component.default_text }}'
		,defaultValue:'{{ component.value }}'
	}
	
	
	return createAdvancedComboBox(baseConfig, params);
})()
