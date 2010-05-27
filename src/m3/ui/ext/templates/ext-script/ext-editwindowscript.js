(function (){
    var win = {{ window.render }};
    
    function submitForm()
    {
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
    	   {% if window.action_context %}baseParams: {{window.action_context.json|safe}},{% endif %}
           success: formSubmitSuccessHandler,
    	   failure: {% if form.failure_handler %}{{form.failure_handler}}{% else %}defaultSubmitFailureHandler{% endif %}
    	});
    }
    
    function formSubmitSuccessHandler(form, action){
    	{% if form.success_handler %}
    	{{ form.success_handler}}();
    	{% endif %}
    	Ext.getCmp('{{window.client_id}}').fireEvent('closed_ok');
    	Ext.getCmp('{{window.client_id}}').close();
    	eval_response(action.response.responseText)
    }
    function defaultSubmitFailureHandler(form, action)
    {
    	{# ------ обработчик сообщения об ошибке субмита по умолчанию ----------- #}
    	eval_response(action.response.responseText)
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
    
    {# показываем окно #}
    win.show();
    
    {{ renderer.window.render_globals }}
    
    return win;
})()