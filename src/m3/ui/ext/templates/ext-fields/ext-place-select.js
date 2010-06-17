(function(){
	var place_combo = new Ext.form.ComboBox({
		{% include 'base-ext-ui.js'%}
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
		{% if component.force_selection %} ,forceSelection:true {% endif %}
		{% if component.not_found_text %}  ,valueNotFoundText: '{{ component.not_found_text }}' {% endif %}
		,resizable: true
		{% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					'{{k}}': {{v}}
					{% if not forloop.last %},{% endif %}
				{% endfor%}
			}
		{% endif %}
	});
    
    /**
     * Создает запись и загружает ее в комбобокс 
     * @param {Object} id Уникальный идентицикатор записи
     * @param {Object} value Текстовое представление записи для показа пользователю
     */
    function addRecordToStore(id, value){	
    	var combo = Ext.getCmp('{{ component.client_id }}');
    	var store = combo.getStore();
    	
    	var record = new Ext.data.Record();
    	record.{{ component.value_field }} = id;
    	record.{{ component.display_field }} = value;
		store.loadData({total:1, rows:[record]});    	
    	combo.setValue(id);
    };
    place_combo.addRecordToStore = addRecordToStore;
    
    {% if self.value %}
    	// Если начальное значение было присвоено, его нужно добавить запись
    	(function(){
    		addRecordToStore('{{ self.value }}', '{{ self.default_text }}');
    	})()
    {% endif %}
    
    return place_combo;
})()