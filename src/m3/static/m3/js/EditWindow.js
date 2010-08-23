/**
 * Окно на базе Ext.m3.Window, которое включает такие вещи, как:
 * 1) Submit формы, если она есть;
 * 2) Навешивание функции на изменение поля, в связи с чем обновляется заголовок 
 * окна;
 * 3) Если поля формы были изменены, то по-умолчанию задается вопрос "Вы 
 * действительно хотите отказаться от внесенных измений";
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
	 * Количество измененных полей
	 */
	,changesCount: 0
	
	/**
	 * Оргинальный заголовок
	 */
	,originalTitle: null
	
	/**
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	,constructor: function(baseConfig, params){
//		console.log('Ext.m3.EditWindow >>');
//		console.log(baseConfig);
//		console.log(params);
		
		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			

		}

		Ext.m3.EditWindow.superclass.constructor.call(this, baseConfig, params);
	}
	/**
	 * Инициализация дополнительного функционала
	 */
	,initComponent: function(){
		Ext.m3.EditWindow.superclass.initComponent.call(this);
		
		// Устанавливает функции на изменение значения
		this.items.each(function(item){
			this.setFieldOnChange(item, this);
		}, this);
	
		this.addEvents(
			/**
			 * Генерируется сообщение до начала запроса на сохранение формы
			 * Проще говоря до начала submit'a
			 * Параметры:
			 *   this - Сам компонент
			*/
			'beforesubmit'
			)
	
	}
	/**
	 * Получает форму по formId
	 */
	,getForm: function() {
		assert(this.formId, 'Не задан formId для формы');
		
		return Ext.getCmp(this.formId).getForm();
	}
	/**
	 * Сабмит формы
	 * @param {Object} btn
	 * @param {Object} e
	 * @param {Object} baseParams
	 */
	,submitForm: function(btn, e, baseParams){
		assert(this.formUrl, 'Не задан url для формы');
		
		this.fireEvent('beforesubmit');
		
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
		    	scope.close(true);
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

		if (sender.originalValue !== newValue) {
			if (!sender.isModified) {
				window.changesCount++;
			}
			sender.isModified = true;
		} else {
			if (sender.isModified){
				window.changesCount--;
			}
					
			sender.isModified = false;
		};
		
		window.updateTitle();
		sender.updateLabel();
    }
	/**
	 * Рекурсивная установка функции на изменение поля
	 * @param {Object} item
	 */
	,setFieldOnChange: function (item, window){
		if (item) {
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
	
	/**
	 * Обновление заголовка окна
	 */
	,updateTitle: function(){
		// сохраним оригинальное значение заголовка
		if (this.title !== this.originalTitle && this.originalTitle === null) {
			this.originalTitle = this.title;
		};

		if (this.changesCount !== 0) {
			this.setTitle('*'+this.originalTitle);
		} else {
			this.setTitle(this.originalTitle);
		}
	}
	/**
	 * Перегрузка закрытия окна со вставкой пользовательского приложения
	 * @param {Bool} forceClose Приндтельное (без вопросов) закрытие окна
	 */
	,close: function (forceClose) {

		if (this.changesCount !== 0 && !forceClose ) {
			var scope = this;
			Ext.Msg.show({
				title: "Не сохранять изменения",
				msg: "Внимание! Данные были изменены! \
								Закрыть без сохранения изменений?",
				buttons: Ext.Msg.OKCANCEL,
				fn: function(buttonId, text, opt){
					if (buttonId === 'ok') {
						Ext.m3.EditWindow.superclass.close.call(scope);
					}
				},
				animEl: 'elId',
				icon: Ext.MessageBox.QUESTION
			});

			return;
		};
		Ext.m3.EditWindow.superclass.close.call(this);
	}
	
})

