(function(){
	var conteiner = new Ext.Container({
		layout: 'column'
		,id: "{{ component.client_id }}"
		,items:
			[{
				xtype: 'container'
				,layout: 'form'
				,items: [ {{ component.combo_box.render|safe }} ]
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
	                var combo = Ext.getCmp('{{ component.combo_box.client_id }}');
	                combo.clearValue(); 
	                combo.fireEvent('change','','');
	            };
	        }
	    });
		{% else %}
            var combo = Ext.getCmp('{{ component.combo_box.client_id }}');
            combo.clearValue(); 
            combo.fireEvent('change','','');
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
						var combo = Ext.getCmp('{{ component.combo_box.client_id }}');
						combo.setValue(displayText);
						// combo.hiddenValue = id;
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
	 * @param {} sender "this" комбобокс
	 * @param {} newValue Новое значение
	 * @param {} oldValue Старое значение 
	 */
	function onChange(sender, newValue, oldValue){
		var clear_btn = Ext.getCmp('{{ component.clear_button.client_id }}');
		if (!newValue){
			clear_btn.setVisible(false);
		} else {
			clear_btn.setVisible(true);	
		};
		console.log(newValue);
	};
	
	return conteiner;
})()