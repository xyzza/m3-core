(function (){
    var win = {{ window.render }};
    
    function submitForm(btn, e, baseParams){
    	var form = Ext.getCmp('{{window.form.client_id}}').getForm();
    	if(!form.isValid())
    	{
    	    {% if window.invalid_form_handler %}
    	    {{ window.invalid_data_handler }}();
    	    {% else %}
    	    Ext.Msg.show({title:'Проверка формы', msg:'Проверьте правильность заполнения полей.<br>Некорректно заполненные поля подчеркнуты красным.', buttons: Ext.Msg.OK, icon: Ext.Msg.WARNING});
    	    {% endif %}
    	    return;
    	}
    	form.submit({
    	   url: '{{ window.form.url }}',
		   params: Ext.applyIf(baseParams || {}, 
		   		{% if window.action_context %} 
					{{window.action_context.json|safe}} 
				{%else%} 
					{} 
				{% endif %}),
           success: formSubmitSuccessHandler,
    	   failure: {% if form.failure_handler %}{{form.failure_handler}}{% else %}defaultSubmitFailureHandler{% endif %}
    	});
    }
    
    function formSubmitSuccessHandler(form, action){
    	{% if form.success_handler %}
    	{{ form.success_handler}}();
    	{% endif %}
		var win = Ext.getCmp('{{window.client_id}}');
    	win.fireEvent('closed_ok');
		win.forceClose = true;
    	win.close();
    	smart_eval(action.response.responseText)
    }
    function defaultSubmitFailureHandler(form, action)
    {
    	{# ------ обработчик сообщения об ошибке субмита по умолчанию ----------- #}
    	smart_eval(action.response.responseText)
    	/*if(action.failureType == 'server'){
            obj = Ext.util.JSON.decode(action.response.responseText);
            Ext.Msg.show({title: '',
                          msg: 'Не удалось сохранить данные формы. ' + obj.error_msg,
                          buttons: Ext.Msg.OK,
                          icon: Ext.Msg.WARNING});
        }else{
            Ext.Msg.show({title: '',
                          msg: 'Не удалось сохранить данные формы. Сервер временно недоступен.',
                          buttons: Ext.Msg.OK,
                          icon: Ext.Msg.WARNING});
        }*/
    	// TODO: написать нормальный разбор сообщения об
    	//Ext.Msg.show({title: 'Сохранение', msg: 'Не удалось сохранить данные формы.', buttons: Ext.Msg.OK, icon: Ext.Msg.WARNING});
    }
    
    function cancelForm()
    {
        Ext.getCmp('{{window.client_id}}').close();
    }
    // пройдемся по всем элементам окна и назначим обработчик 'change' всем полям редактирования
	function onChangeFieldValue(sender, newValue, oldValue) {
        var win = Ext.getCmp('{{window.client_id}}');
		if (this.originalValue !== newValue) {
        	//alert(this.fieldLabel+' изменен!');
			if (!this.isModified)
				win.changesCount++;
			this.isModified = true;
		} else {
			if (this.isModified)
				win.changesCount--;
			this.isModified = false;
		};
		win.updateTitle();
		this.updateLabel();
    };
	function setFieldOnChange(item){
		if (item) {
			if (item instanceof Ext.form.Field && item.isEdit) {
				item.on('change', onChangeFieldValue);
			};			
			if (item.items) {
				if (!(item.items instanceof Array)) {	
					console.log(item);
					item.items.each(function(it){					
            			setFieldOnChange(it);
        			});
				} else {
					console.log(item);
					for (var i = 0; i < item.items.length; i++) {
						setFieldOnChange(item.items[i]);
					};
				}
			};
			// оказывается есть еще и заголовочные элементы редактирования
			if (item.titleItems) {
				for (var i = 0; i < item.titleItems.length; i++) {
					setFieldOnChange(item.titleItems[i]);
				};
			};			
		};
	};
	win.items.each(function(item){
		setFieldOnChange(item);
	})
	// подтверждение при закрытии окна
	function onBeforeClose(win) {
		if (win.forceClose) {return true;}
		if (win.changesCount !== 0) {
			Ext.Msg.show({
				title: "Не сохранять изменения",
				msg: "Внимание! Данные были изменены! Желаете закрыть окно без сохранения изменений?",
				buttons: Ext.Msg.OKCANCEL,
				fn: function(buttonId, text, opt){
					switch (buttonId){
						case 'cancel':
							break;
						case 'ok':
							var win = Ext.getCmp('{{window.client_id}}');
							// выставляем признак принудительного выхода и закрываем - а иначе никак!
							win.forceClose = true;
							win.close();
            				break;
					}
				},
				animEl: 'elId',
				icon: Ext.MessageBox.QUESTION
			});
			// возвращаем ложь, пока не ответят на диалог
			return false;
		} else {return true;}
	};
	win.on('beforeclose', onBeforeClose);
    {{ renderer.window.render_globals }}
    {# показываем окно #}
    win.show();    
    return win;
})()