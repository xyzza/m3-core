/**
 * Окно на базе Ext.m3.Window, которое включает такие вещи, как:
 */

Ext.m3.EditWindow = Ext.extend(Ext.m3.Window, {
	
	/**
	 * id формы в окне, для сабмита
	 */
	formId: null
	
	/**
	 * url формы в окне дя сабмита
	 */
	,formUrl: null
	
	/**
	 * Контекст 
	 */
	,actionContextJson: null
	
	/**
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	,constructor: function(baseConfig, params){
		console.log('Ext.m3.EditWindow >>');
		console.log(baseConfig);
		console.log(params);
		
		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			if (params.contextJson){
				this.actionContextJson = params.contextJson;
			}
		}

		Ext.m3.EditWindow.superclass.constructor.call(this, baseConfig);
	}
	/**
	 * Инициализация дополнительного функционала
	 */
	,initComponent: function(){
		Ext.m3.EditWindow.superclass.initComponent.call(this);
		
		// Устанавливает функции на изменение значения
		console.log('>>');
		this.items.each(function(item){
			console.log(item);
			this.setFieldOnChange(item, this);
		}, this);
	}
	/**
	 * Сабмит формы
	 * @param {Object} btn
	 * @param {Object} e
	 * @param {Object} baseParams
	 */
	,submitForm: function(btn, e, baseParams){
		assert(this.formUrl, 'Не задан url для формы');
		
		var form = Ext.getCmp(this.formId).getForm();
		if (form && !form.isValid()) {
			Ext.Msg.show({
				title: 'Проверка формы',
				msg: 'Проверьте правильность заполнения полей.<br>Некорректно' +
						'заполненные поля подчеркнуты красным.',
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});
			
			return;
		}
		var scope = this;
    	form.submit({
    	   url: this.formUrl
		   ,submitEmptyText: false
		   ,params: Ext.applyIf(baseParams || {}, this.actionContextJson || {})
		   ,success: function(form, action){
				scope.fireEvent('closed_ok');
				scope.forceClose = true;
		    	scope.close();
		    	smart_eval(action.response.responseText)
		   }
		   ,failure: function (form, action){
		   		smart_eval(action.response.responseText)
		   }
    	});
	}
	
	 /**
	  * Функция на изменение поля
	  * @param {Object} sender
	  * @param {Object} newValue
	  * @param {Object} oldValue
	  */
	,onChangeFieldValue: function (sender, newValue, oldValue, window) {
		console.log('>> onChangeFieldValue')
		
		if (sender.originalValue !== newValue) {
			if (!sender.isModified)
				window.changesCount++;
			sender.isModified = true;
		} else {
			if (sender.isModified)
				window.changesCount--;
				
			sender.isModified = false;
		};
		
		console.log(sender);
		window.updateTitle();
		sender.updateLabel();
    }
	/**
	 * Рекурсивная установка функции на изменение поля
	 * @param {Object} item
	 */
	,setFieldOnChange: function (item, window){
		console.log('>> setFieldOnChange');
		if (item) {
			console.log(window);
			if (item instanceof Ext.form.Field && item.isEdit) {
				item.on('change', function(scope, newValue, oldValue){
					window.onChangeFieldValue(scope, newValue, oldValue, window);
				});
			};
			if (item.items) {
				if (!(item.items instanceof Array)) {	
					item.items.each(function(it){					
            			window.setFieldOnChange(it, window);
        			});
				} else {
					for (var i = 0; i < item.items.length; i++) {
						window.setFieldOnChange(item.items[i], window);
					};
				}
			};
			// оказывается есть еще и заголовочные элементы редактирования
			if (item.titleItems) {
				for (var i = 0; i < item.titleItems.length; i++) {
					window.setFieldOnChange(item.titleItems[i], window);
				};
			};
		};
	}
	
	// Перенести в класс Ext.m3.EditWindow -->>
	// счетчик изменений и заголовок для хранения первоначального значения
	// перенесено сюда из template окна
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
	// <<--
	
})

