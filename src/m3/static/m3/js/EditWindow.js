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
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	constructor: function(baseConfig, params){
		
		/**
		 * id формы в окне, для сабмита
		 */
		this.formId = null;
		
		/**
		 * url формы в окне для сабмита
		 */
		this.formUrl = null;
		
		/**
		 * url формы в окне для чтения данных
		 */
		this.dataUrl = null;

		/**
		 * Количество измененных полей
		 */
		this.changesCount = 0;

		/**
		 * Оргинальный заголовок
		 */
		this.originalTitle = null;


		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			if (params.dataUrl){
				this.dataUrl = params.dataUrl;
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
			 *   @param {Object} submit - sumbit-запрос для отправки на сервер
			*/
			'beforesubmit'
			/**
			 * Генерируется, если произошел запрос на закрытие окна
			 * (через win.close()) при несохраненных изменениях, а пользователь
			 * в диалоге, запрашивающем подтверждение закрытия без сохранения,
			 * отказался закрывать окно.
			 * Параметры:
			 *   this - Сам компонент
			 */
			 ,'closing_canceled'
			 /*
			  * Генерируеются перед отправкой запроса на сервер за обновленными данными.
			  * Можно изменить передаваемые параметры.
			  *   this - Сам компонент
			  *   @param {Object} load - Параметры ajax-запроса для отправки на сервер
			  */
			 ,'beforeloaddata'
			 /*
			  * Генерируеются после успешного запроса данных.
			  *   this - Сам компонент
			  *   @param {Object} action - Результаты запроса
			  */
			 ,'dataloaded'
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
	 * Проверяет форму на наличие некорректных полей, отдает список label'ов этих полей
	 */
    ,getInvalidNames: function(submittedForm){
                var invalidNames = [];
                submittedForm.items.each(function(f){
                   if(!f.validate()){
                       invalidNames.push('<br>- ' + f.fieldLabel)
                   }
                });
                return invalidNames
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
		if (form){
            invalidNames = this.getInvalidNames(form);
            if (invalidNames.length){
                Ext.Msg.show({
                    title: 'Проверка формы',
                    msg: 'На форме имеются некорректно заполненные поля:' + invalidNames.toString() + '.',
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.WARNING
                });
			    return;
            }
		}
				
        var scope = this;
		var mask = new Ext.LoadMask(this.body, {msg:'Сохранение...'});
		var params = Ext.applyIf(baseParams || {}, this.actionContextJson || {});

        // На форме могут находиться компоненты, которые не являются полями, но их можно сабмитить
        // Находим такие компоненты по наличию атрибутов name и localEdit
        var getControls = function(items){
            var result = new Array();
            for (var i = 0; i < items.getCount(); i++){
                var control = items.get(i);
                if (control.name && control.localEdit){
                    result.push(control);
                } else if (control instanceof Ext.Container) {
                    var cc = getControls(control.items);
                    result = result.concat(cc);
                }
            }
            return result;
        }

        // В params сабмита добавляются пары, где ключ - имя компонента,
        // а значение - массив из записей стора этого компонента. Пример:
        // "mainGrid": [{"id": 1, "name": "First"}, {"id": 2, "name": "Second"}]
        var cControls = getControls(this.items);
        for (var i = 0; i < cControls.length; i++){
            var cControl = cControls[i];
            var cStore = cControl.getStore();
            var cStoreData = new Array();
            for (var j = 0; i < cStore.data.items.length; i++){
                cStoreData.push(cStore.data.items[0].data);
            }
            params[cControl.name] = Ext.util.JSON.encode(cStoreData);
        }

		// вытащим из формы все поля и исключим их из наших параметров, иначе они будут повторяться в submite
		var fElements = form.el.dom.elements || (document.forms[form.el.dom] || Ext.getDom(form.el.dom)).elements;
		var name;
		Ext.each(fElements, function(element){
        	name = element.name;
        	if (!element.disabled && name) {
        		delete params[name];
        	}
        });
		
		var submit = {
            url: this.formUrl
           ,submitEmptyText: false
           ,params: params
           ,success: function(form, action){
              scope.fireEvent('closed_ok', action.response.responseText);
              scope.close(true);
              try { 
                  smart_eval(action.response.responseText);
              } finally { 
                  mask.hide();
                  scope.disableToolbars(false);
              }
           }
           ,failure: function (form, action){
              uiAjaxFailMessage.apply(scope, arguments);
              mask.hide();
              scope.disableToolbars(false);
           }
        };
        
        if (scope.fireEvent('beforesubmit', submit)) {
            this.disableToolbars(true);
        	mask.show();
        	form.submit(submit);
        }
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
	 * 
	 * Если forceClose != true и пользователь в ответ на диалог
	 * откажется закрывать окно, возбуждается событие 'closing_canceled'
	 */
	,close: function (forceClose) {

		if (this.changesCount !== 0 && !forceClose ) {
			var scope = this;
			Ext.Msg.show({
				title: "Внимание",
				msg: "Данные были изменены! Cохранить изменения?",
				buttons: Ext.Msg.YESNOCANCEL,
				fn: function(buttonId, text, opt){
					if (buttonId === 'yes') {
						this.submitForm();
					} else if (buttonId === 'no') {
					    Ext.m3.EditWindow.superclass.close.call(scope);					  
					} else {
					   scope.fireEvent('closing_canceled');  
					}
				},
				animEl: 'elId',
				icon: Ext.MessageBox.QUESTION,
				scope: this				
			});

			return;
		};
		Ext.m3.EditWindow.superclass.close.call(this);
	}
    ,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
    /*
     * Динамическая загрузка данных формы
     */
    ,loadForm: function() {
        assert(this.dataUrl, 'Не задан dataUrl для формы');
        var form = this.getForm();
        var mask = new Ext.LoadMask(this.body, {msg:'Чтение данных...'});
        var load = {
            url: this.dataUrl
            ,params: Ext.applyIf({isGetData: true}, this.actionContextJson || {})
            ,success: function(form, action){
                // Сложным контролам, данные которых хранятся в Store, недостаточно присвоить value.
                // Для них передаются готовые записи Store целиком.
                var complex_data = action.result.complex_data;
                for (var fieldName in complex_data){
                    var field = form.findField(fieldName);

                    // Создаем запись и добавляем в стор
                    var record = new Ext.data.Record();
                    var id = complex_data[fieldName].id;
                    record['id'] = id;
                    record[field.displayField] = complex_data[fieldName].value;
                    field.getStore().loadData({total:1, rows:[record]});

                    // Устанавливаем новое значение
                    field.setValue(id);
                    field.collapse();
                }
                
            	mask.hide();
                this.disableToolbars(false);
                this.fireEvent('dataloaded', action);
            }
            ,failure: function (){
                uiAjaxFailMessage.apply(this, arguments);
                mask.hide();
                this.disableToolbars(false);
           }
           ,scope: this
        };
        this.disableToolbars(true);
        mask.show();
        if (this.fireEvent('beforeloaddata', load)) {
        	form.doAction('load', load);
        }
    }
})