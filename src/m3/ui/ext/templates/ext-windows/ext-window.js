(function(){
    var win = new Ext.Window({
        {% include 'base-ext-ui.js'%}
	    
	    {% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.modal %}, modal: true {% endif %}
		{% if component.maximized %}, maximized: true {% endif %}
		{% if component.minimized %}, minimized: true {% endif %}
		
		{% ifnotequal component.t_get_minimizable "None" %}
		,minimizable: {{component.t_get_minimizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_maximizable "None" %}
		,maximizable: {{component.t_get_maximizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_closable "None" %}
		,closable: {{component.t_get_closable|lower }}
		{% endifnotequal %}	
	
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.body_style %}, bodyStyle : '{{ component.body_style }}' {% endif %}
		{% if component.layout %} ,layout: '{{ component.layout}}' {% endif %}
		{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
		
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	    ,items:[{{ component.t_render_items|safe }}]  
	    {% if component.buttons %},{{ component.t_render_buttons|safe }}{% endif %}	
	    {% if not component.resizable %} ,resizable: false {% endif %}
		{% if component.parent_window_id %} ,parentWindowID: '{{ component.parent_window_id }}' {% endif %}
	    {% block window_extenders %}{# здесь помещяется код, расширяющий описание экземпляра окна #}{% endblock %}
		
		// счетчик изменений и заголовок для хранения первоначального значения
		,changesCount: 0
		,originalTitle: ''
		,updateTitle: function(){
			// сохраним оригинальное значение заголовка
			if (this.title !== this.originalTitle && this.originalTitle == '') {
				this.originalTitle = this.title;
			};
			// изменим заголовок в связи с изменением полей в окне
			if (this.changesCount !== 0) {
				this.setTitle('*'+this.originalTitle);
			} else {
				this.setTitle(this.originalTitle);
			}
		}
		,forceClose: false
	});
	{% block code_extenders %}{# здесь помещяется код, расширяющий функциональность окна #}{% endblock %}
	
	// пройдемся по всем элементам окна и назначим обработчик 'change' всем полям редактирования
	function onChangeFieldValue(sender, newValue, oldValue) {
        var win = Ext.getCmp('{{ component.client_id }}');
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
			if (item instanceof Ext.form.Field) {
				item.on('change', onChangeFieldValue);
			};
			if (item.items) {
				item.items.each(function(it){
					setFieldOnChange(it);
				});
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
		return true;
		/* временно отключил нах проверку
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
							var win = Ext.getCmp('{{ component.client_id }}');
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
		*/
	};
	win.on('beforeclose', onBeforeClose);
	return win;
})()
