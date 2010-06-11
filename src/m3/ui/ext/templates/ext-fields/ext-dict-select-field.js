(function(){
    var container = new Ext.Container({
    	layout: 'column'
    	,items:
    		[{
    			xtype: 'container'
    			,columnWidth:1
    			,layout: 'form'
    			{% if component.label_width %} ,labelWidth: {{ component.label_width }} {% endif %}
    			,items: {
    					xtype: 'combo'
    					,{% include 'base-ext-ui.js'%}
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
    		{ xtype: 'container', layout:'form',layoutConfig: {pack:'end',align:'center'}, width:30, items: {{ component.select_button.render|safe }} },
    		{ xtype: 'container', layout:'form',layoutConfig: {pack:'end',align:'center'}, width:30, items: {{ component.clear_button.render|safe }} }
    	]
    });
    
	var dict_combo = Ext.getCmp('{{ component.client_id }}');
	
    /**
     * Очищает значение контрола
     */
    function onClearField(){
    	{% if component.ask_before_deleting %}
        Ext.Msg.show({
            title: 'Подтверждение',
            msg: 'Вы действительно хотите очистить выбранное значение?',
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
    dict_combo.onClearField = onClearField;
    
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
    	store.loadData({total:1, rows:[record]});
    	combo.setValue(id);
    	onChange(combo, id);
    };
    dict_combo.addRecordToStore = addRecordToStore;
	
    /**
     * Реакция на нажатие кнопки выбора из справочника
     */
    function onSelect(){
		dict_combo.fireEvent('dict_beforeSelect');
		
        ajax.request({
            url: '{{ component.url }}'
			,params: Ext.applyIf({},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
            ,success: function(response, opts){
                var win = smart_eval(response.responseText);
                if (win != undefined){
                    win.on('closed_ok',function(id, displayText){
						var result = dict_combo.fireEvent('dict_onSelect', id, displayText, dict_combo);
						if (result){
							// Действие по умолчанию
							addRecordToStore(id, displayText);
						}
                    });
                };
            }
            ,failure: function(response, opts){
				uiAjaxFailMessage();
            }
    	});
		
		dict_combo.fireEvent('dict_afterSelect');
    };
    
    /**
     * Обработчик на изменение значения
     * @param {object} sender "this" комбобокс
     * @param {string} newValue Новое значение
     * @param {string} oldValue Старое значение 
     */
    function onChange(sender, newValue, oldValue){
    	var clear_btn = Ext.getCmp('{{ component.clear_button.client_id }}');
    	var combo = Ext.getCmp('{{ component.client_id }}');
		clear_btn.setVisible(newValue);
    };
    
    {% if self.value %}
    	// Если начальное значение было присвоено, его нужно добавить запись
    	(function(){
    		addRecordToStore('{{ self.value }}', '{{ self.default_text }}');
    	})()
    {% endif %}
    
	// События поля выбора из справочника. Префикс dict_ чтобы не было пересечений.
    dict_combo.addEvents('dict_beforeSelect', 'dict_afterSelect', 'dict_onSelect');
	
    return container;
})()