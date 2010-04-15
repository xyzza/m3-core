(function(){
	
	var conteiner = new Ext.Container({
		layout: 'column'

		,items:
			[{
				xtype: 'container'
				,layout: 'form'
				,items: {
						xtype: 'combo'
						,id: '{{ component.client_id }}'
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
						,valueNotFoundText: ''
						
						{% if component.t_render_listeners %}
							{# Прописываются имеющиеся обработчики #}
							,listeners:{
								{% for k, v in component.t_render_listeners.items %}
									'{{k}}': {{v}}
									{% if not forloop.last %},{% endif %}
								{% endfor%}
							}
						{% endif %}
				
				}
			},
			{{ component.select_button.render|safe }},
			{{ component.clear_button.render|safe }}
		]
	});

	/**
	 * Очищает значение контрола
	 */
	function onClearField(){
		{% if component.ask_before_deleting %}
	    Ext.Msg.show({
	        title: 'Подтверждение',
	        msg: 'Вы действительно хотите очистить значение?',
	        icon: Ext.Msg.QUESTION,
	        buttons: Ext.Msg.YESNO,
	        fn:function(btn,text,opt){ 
	            if (btn == 'yes') {
	                var combo = Ext.getCmp('{{ component.client_id }}');
	                combo.clearValue(); 
	                combo.fireEvent('change','','');
	            };
	        }
	    });
		{% else %}
            var combo = Ext.getCmp('{{ component.client_id }}');
            combo.clearValue(); 
            combo.fireEvent('change',combo,'');
		{% endif%}
	};
	
	var ajax = Ext.Ajax;
	
	/**
	 * Создает запись и загружает ее в комбобокс 
	 * @param {Object} id Уникальный идентицикатор записи
	 * @param {Object} value Текстовое представление записи для показа пользователю
	 */
	function addRecordToStore(id, value){	
		var combo = Ext.getCmp('{{ component.client_id }}');
		var store = combo.getStore();
		
		var record = new Ext.data.Record();
		record.id = id;
		record.{{ component.display_field }} = value;
		store.loadData(record);
		combo.setValue(id);
		onChange(combo, id);
	};
	
	/**
	 * Реакция на нажатие кнопки выбора из справочника
	 */
	function onSelect(){
		ajax.request({
			url: '{{ component.url }}'
			,success: function(response, opts){
			    var win = m3_eval(response.responseText);
		    	if (win!=undefined){
					win.on('select_value',function(id, displayText){
						addRecordToStore(id, displayText);
					});
				};
			}
			,failure: function(response, opts){
			   Ext.Msg.alert('','failed');
			}
		});
	};	
	
	/**
	 * Обработчик на изменение значения
	 * @param {object} sender "this" комбобокс
	 * @param {string} newValue Новое значение
	 * @param {string} oldValue Старое значение 
	 */
	function onChange(sender, newValue, oldValue){
		console.log(sender);
		var clear_btn = Ext.getCmp('{{ component.clear_button.client_id }}');
		var combo = Ext.getCmp('{{ component.client_id }}');
		if (!newValue){
			clear_btn.setVisible(false);
			sender.setWidth({{ component.width }});
		} else {
			clear_btn.setVisible(true);	
			sender.setWidth({{ component.width }} - 25);
		};
	};
	
	{%if component.value%}
		// Если начальное значение было присвоено, его нужно добавить запись
		(function(){
			addRecordToStore('{{ component.value }}', '{{ component.default_text }}');
		})()
	{%endif%}
	
	return conteiner;
})()