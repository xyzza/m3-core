(function(){
	var conteiner = new Ext.Container({
		layout: 'column',
		items:
			[{
				xtype: 'container',
				layout: 'form',
				items: {
					xtype: 'textfield'
					,id: "{{ component.client_id }}"
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
					
					{% if component.label %} ,fieldLabel: '{{ component.label }}' {% endif %}
					{% if component.name %} ,name: '{{ component.name }}' {% endif %}
					{% if component.value %} ,value: '{{ component.value }}' {% endif %}
					{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
					,readOnly: true
				}
			},
			{{ component.select_button.render|safe }},
			{{ component.clean_button.render|safe }}
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
					var client_id = '{{ component.client_id }}'; 
	                Ext.getCmp(client_id).setValue(''); 
					Ext.getCmp(client_id).reference_id='';
	            }
	        }
	    });
		{% else %}
			var client_id = '{{ component.client_id }}'; 
	        Ext.getCmp(client_id).setValue(''); 
			Ext.getCmp(client_id).reference_id='';
		{% endif%}
	};
	
	var ajax = Ext.Ajax;
	
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
						var field = Ext.getCmp('{{ component.client_id}}');
						field.setValue(displayText);
					});
				};
			}
			,failure: function(response, opts){
			   Ext.Msg.alert('','failed');
			}
		});
	};	
	
	return conteiner;
})()