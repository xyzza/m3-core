'use strict';
/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */

Ext3.m3.AdvancedComboBox = Ext3.extend(Ext3.m3.ComboBox, {
	constructor: function(baseConfig, params){

		/**
		 * Инициализация значений
		 */
		
		// Будет ли задаваться вопрос перед очисткой значения
		this.askBeforeDeleting = true;
		
		this.actionSelectUrl = null;
		this.actionEditUrl = null;
		this.actionContextJson = null;
		
		this.hideBaseTrigger = false;
		
		this.defaultValue = null;
		this.defaultText = null;
        this.defaultRecord = null;
		
		// кнопка очистки
		this.hideTriggerClear = params.hideClearTrigger || false;
		
		// кнопка выбора из выпадающего списка
		this.hideTriggerDropDown = false;
		
		// кнопка выбора из справочника
		this.hideTriggerDictSelect =  params.hideDictSelectTrigger || false;
		
		// кнопка редактирования элемента
		this.hideTriggerDictEdit = true;
		if (!params.hideEditTrigger){
			this.hideTriggerDictEdit = params.hideEditTrigger;
		}
		
		// Количество записей, которые будут отображаться при нажатии на кнопку 
		// выпадающего списка
		this.defaultLimit = '50';
		
		// css классы для иконок на триггеры 
		this.triggerClearClass = 'x3-form-clear-trigger';
		this.triggerSelectClass = 'x3-form-select-trigger';
		this.triggerEditClass = 'x3-form-edit-trigger';



		assert(params.actions, 'params.actions is undefined');
		
		if (params.actions.actionSelectUrl) {
			this.actionSelectUrl = params.actions.actionSelectUrl;
		}
		
		if (params.actions.actionEditUrl) {
			this.actionEditUrl = params.actions.actionEditUrl;
		}
		
		this.askBeforeDeleting = params.askBeforeDeleting;
		this.actionContextJson = params.actions.contextJson;
		
		this.hideBaseTrigger = false;
		if (baseConfig.hideTrigger) {
			delete baseConfig.hideTrigger;
			this.hideBaseTrigger = true;
		}
		

		this.defaultValue = params.defaultValue;
		this.defaultText = params.defaultText;
        this.defaultRecord = Ext3.decode(params.recordValue);

		this.baseTriggers = [{
				iconCls: 'x3-form-clear-trigger',
				handler: null,
				hide: null
			},{
				iconCls:'', 
				handler: null,
				hide: null
			},{
				iconCls:'x3-form-select-trigger', 
				handler: null,
				hide: null
			},{
				iconCls:'x3-form-edit-trigger', 
				handler: null,
				hide: true
			}
		];
		this.allTriggers = [].concat(this.baseTriggers);
		if (params.customTriggers) {
			Ext3.each(params.customTriggers, function(item, index, all){
				this.allTriggers.push(item);
			}, this);
		
		}

		Ext3.m3.AdvancedComboBox.superclass.constructor.call(this, baseConfig);
	},
	/**
	 * Конфигурация компонента 
	 */
	initComponent: function () {
		Ext3.m3.AdvancedComboBox.superclass.initComponent.call(this);
		
		// см. TwinTriggerField
        this.triggerConfig = {
            tag:'span', cls:'x3-form-twin-triggers', cn:[]};

		Ext3.each(this.allTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext3.BLANK_IMAGE_URL, cls: "x3-form-trigger " + item.iconCls}
			);
		}, this);

		if (!this.actionSelectUrl) {
			this.hideTriggerDictSelect = true;
		}
		
		if (!this.actionEditUrl) {
			this.hideTriggerDictEdit = true;
		}
		
		if (this.hideBaseTrigger){
			this.hideTriggerDropDown = true;
		}

		// Значения по-умолчанию
        if (this.defaultRecord){
            var record = new Ext3.data.Record(this.defaultRecord);
            this.setRecord(record);
        } else {
            if (this.defaultValue && this.defaultText) {
                this.addRecordToStore(this.defaultValue, this.defaultText);
            }
        }

        this.validator = this.validateField;

		// Инициализация базовой настройки триггеров
		this.initBaseTrigger();
		
		this.addEvents(
			/**
			 * Генерируется сообщение при нажатии на кнопку вызыва запроса на сервер
			 * Параметры:
			 *   this - Сам компонент
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'beforerequest',
		
			/**
			 * Генерируется сообщение после выбора значения. 
			 * Здесь может быть валидация и прочие проверки
			 * Параметры:
			 *   this - Сам компонент
			 *   id - Значение 
			 *   text - Текстовое представление значения
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'afterselect',
		
			/**
			 * Генерируется сообщение после установки значения поля
			 * По-умолчанию в комбобоксе change генерируется при потери фокуса
			 * В данном контроле вызов change сделан после выбора значения и 
			 * потеря фокуса контрола обрабатывается вручную
			 * Параметры:
			 *   this - Сам компонент
			*/
			'changed'
		);
		
		this.getStore().baseParams = Ext3.applyIf({start:0, limit: this.defaultLimit }, this.getStore().baseParams );
        this.triggerAction = 'all';
	},
	// см. TwinTriggerField
	getTrigger : function(index){
        return this.triggers[index];
    },
	// см. TwinTriggerField
    initTrigger : function(){
        var ts = this.trigger.select('.x3-form-trigger', true),
            triggerField = this;
        ts.each(function(t, all, index){
			
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.allTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
        }, this);

        this.disableTriggers(this.disabled);
		
        this.triggers = ts.elements;
    },

    getWidth: function() {
        // неверно пересчитывался размер поля
        //Ext3.m3.AdvancedComboBox.superclass.getWidth.call(this);
        return(this.el.getWidth() + this.getTriggerWidth());
    },
    /**
     * Устанавливает или снимает с кнопок обработчики,
     * в зависимости от того, доступно ли поле.
     */
    disableTriggers: function(disabled){
        if (this.trigger) {
            var ts = this.trigger.select('.x3-form-trigger', true);
            ts.each(function(t, all, index){
                var handler = this.allTriggers[index].handler,
                    events = Ext3.elCache[t.id].events;
                if (!disabled) {
                    // Чтобы не добавлять событие несколько раз, нужно проверить есть ли оно уже
                    if (!events.click || events.click.length === 0){
                        t.on('click', handler, this, {preventDefault:true});
                        t.addClassOnOver('x3-form-trigger-over');
                        t.addClassOnClick('x3-form-trigger-click');
                    }
                } else {
                    t.un('click', handler, this, {preventDefault:true});
                }
            }, this);
        } else {
            this.baseTriggers[0].hide = disabled;
            this.baseTriggers[1].hide = disabled;
            this.baseTriggers[2].hide = disabled;
            this.baseTriggers[3].hide = disabled;
        }
    }

	/**
	 * Инициализация первоначальной настройки триггеров 
	 */
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClearClick;
		this.baseTriggers[1].handler = this.onTriggerDropDownClick;
		this.baseTriggers[2].handler = this.onTriggerDictSelectClick;
		this.baseTriggers[3].handler = this.onTriggerDictEditClick;
		
		this.baseTriggers[0].hide = this.hideTriggerClear || this.readOnly || this.disabled;
		this.baseTriggers[1].hide = this.hideTriggerDropDown || this.readOnly || this.disabled;
		this.baseTriggers[2].hide = this.hideTriggerDictSelect || this.readOnly || this.disabled;
		this.baseTriggers[3].hide = this.hideTriggerDictEdit || this.readOnly || this.disabled;
		
		if (!this.getValue()) {
			this.baseTriggers[0].hide = true;
			this.baseTriggers[3].hide = true; 
		}
	},
	
	// см. TwinTriggerField
    getTriggerWidth: function(){
        var tw = 0;
        Ext3.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();

            //if(w === 0 && !this['hidden' + triggerIndex]){
            //    tw += this.defaultTriggerWidth;
            //}else{
            //    tw += w;
            //}
            tw += w;
        }, this);
        return tw;
    },
	// см. TwinTriggerField
    // private
    onDestroy : function() {
        Ext3.destroy(this.triggers);
		Ext3.destroy(this.allTriggers);
		Ext3.destroy(this.baseTriggers);
        Ext3.m3.AdvancedComboBox.superclass.onDestroy.call(this);
    },

	/**
	 * Вызывает метод выпадающего меню у комбобокса
	 **/
	onTriggerDropDownClick: function() {
		if (this.fireEvent('beforerequest', this)) {

			if (this.isExpanded()) {
				this.collapse();
			} else {
				this.onFocus({});
				this.doQuery(this.allQuery, true);
			}
			this.el.focus();
		}
	},
	/**
	 * Кнопка открытия справочника в режиме выбора
	 */
	onTriggerDictSelectClick: function() {
		this.onSelectInDictionary();
	},
	/**
	 * Кнопка очистки значения комбобокса
	 */
	onTriggerClearClick: function() {
		if (this.askBeforeDeleting) {
			var scope = this;
			Ext3.Msg.show({
	            title: 'Подтверждение',
	            msg: 'Вы действительно хотите очистить выбранное значение?',
	            icon: Ext3.Msg.QUESTION,
	            buttons: Ext3.Msg.YESNO,
	            fn: function(btn,text,opt){
	                if (btn === 'yes') {
	                    scope.clearValue(); 
	                }
	            }
	        });	
		} else {
			this.clearValue();
		}
	},
	/**
	 * Кнопка открытия режима редактирования записи
	 */
	onTriggerDictEditClick: function() {
		this.onEditBtn();
	},
	/**
	 * При выборе значения необходимо показывать кнопку "очистить"
	 * @param {Object} record
	 * @param {Object} index
	 */
	onSelect: function(record, index){
		if (this.fireEvent('afterselect', this, record.data[this.valueField], record.data[this.displayField] )) {
			Ext3.m3.AdvancedComboBox.superclass.onSelect.call(this, record, index);
            this.showClearBtn();
            this.showEditBtn();
			this.fireEvent('change', this, record.data[this.valueField || this.displayField]);
			this.fireEvent('changed', this);
		}
	},
	/**
	 * Показывает кнопку очистки значения
	 */
	showClearBtn: function(){
        if (!this.hideTriggerClear && this.rendered && !this.readOnly && !this.disabled) {
            this.getTrigger(0).show();
        } else {
            this.hiddenTrigger1 = false || this.hideTriggerClear || this.readOnly || this.disabled;
        }
	},
	/**
	 * Скрывает кнопку очистки значения
	 */
	hideClearBtn: function(){
        if (this.rendered) {
            this.getTrigger(0).hide();
        } else {
            this.hiddenTrigger1 = true;
        }
	},
	/**
	 * Показывает кнопку открытия карточки элемента
	 */
	showEditBtn: function(){
        if (this.actionEditUrl && this.rendered && !this.hideTriggerDictEdit && this.getValue()) {
            this.getTrigger(3).show();
        } else {
            this.hiddenTrigger4 = false || this.actionEditUrl || this.hideTriggerDictEdit || this.readOnly || this.disabled;
        }
	},
	/**
	 * Скрывает кнопку открытия карточки элемента
	 */
	hideEditBtn: function(){
        if (this.actionEditUrl && this.rendered) {
            this.getTrigger(3).hide();
        } else {
            this.hiddenTrigger4 = true;
        }
	},
	/**
	 * Перегруженный метод очистки значения, плюс ко всему скрывает 
	 * кнопку очистки
	 */
	clearValue: function(){
		var oldValue = this.getValue();
		Ext3.m3.AdvancedComboBox.superclass.clearValue.call(this);
		this.hideClearBtn();
		this.hideEditBtn();
		
		this.fireEvent('change', this, '', oldValue);
		this.fireEvent('changed', this);
	},
	/**
	 * Перегруженный метод установки значения, плюс ко всему отображает 
	 * кнопку очистки
	 */
	setValue: function(value){
		Ext3.m3.AdvancedComboBox.superclass.setValue.call(this, value);
		if (value) {
			this.showClearBtn();
			this.showEditBtn();
		}
	},
	/**
	 * Генерирует ajax-запрос за формой выбора из справочника и
	 * вешает обработку на предопределенное событие closed_ok
	 */
	onSelectInDictionary: function(){
		assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );
		
		if(this.fireEvent('beforerequest', this)) { 
			var scope = this;
			Ext3.Ajax.request({
				url: this.actionSelectUrl,
				method: 'POST',
				params: this.actionContextJson,
				success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
				        win.on('closed_ok',function(id, displayText){
							if (scope.fireEvent('afterselect', scope, id, displayText)) {
								scope.addRecordToStore(id, displayText);
							}
							
				        });
				    }
				},
				failure: function(response, opts){
					uiAjaxFailMessage.apply(this, arguments);
				}
			});
		}
	},
	/**
	 * Добавляет запись в хранилище и устанавливает ее в качестве выбранной
	 * @param {Object} id Идентификатор
	 * @param {Object} value Отображаемое значение
	 */
	addRecordToStore: function(id, value){
        var record = new Ext3.data.Record(),
            oldValue = this.getValue();
        record.id = id;
        record[this.displayField] = value;

        this.getStore().loadData({total:1, rows:[record]}, true);

        this.setValue(id);
        this.collapse();

        this.fireEvent('change', this, id, oldValue);
        this.fireEvent('changed', this);
    },
    /**
     * Установка значения как готовой записи
     * @param {Ext3.data.Record} record Запись-значение
     */
    setRecord: function(record){
        if (record){
            var store = this.getStore(),
            // узнаем ключ новой записи
                key = record.data[this.valueField],
            // найдем похожую запись
                index = store.find(this.valueField, key);

            // если нашли, то заменим запись
            if (index >= 0) {
                store.removeAt(index);
            }
            // иначе добавим
            store.add(record);
            // сделаем ее выбранной
            this.onSelect(record, index);
        } else {
            this.clearValue();
        }
    },
    /**
     * Получение значения как записи из store
     * @return {Ext3.data.Record} Запись-значение
     */
    getRecord: function(){
        var store = this.getStore(),
        // узнаем ключ записи
            key = this.getValue(),
        // найдем запись
            index = store.find(this.valueField, key);
        // если нашли, то вернем
        if (index >= 0) {
            return store.getAt(index);
        }
        // иначе вернем пусто
        return null;
    },
	/**
	 * Обработчик вызываемый по нажатию на кнопку редактирования записи
	 */
	onEditBtn: function(){
		assert( this.actionEditUrl, 'actionEditUrl is undefined' );
		
		// id выбранного элемента для редактирования
		var value_id = this.getValue();
		assert( value_id, 'Value not selected but edit window called' );
		
		Ext3.Ajax.request({
			url: this.actionEditUrl,
			method: 'POST',
			params: Ext3.applyIf({id: value_id}, this.actionContextJson),
			success: function(response, opts){
			    smart_eval(response.responseText);
			},
			failure: function(response, opts){
				uiAjaxFailMessage();
			}
		});
	},
	/**
	 * Не нужно вызывать change после потери фокуса
	 */
	triggerBlur: function () {
		if(this.focusClass){
            this.el.removeClass(this.focusClass);
        }
		if(this.wrap){
            this.wrap.removeClass(this.wrapFocusClass);
        }
        // Очистка значения, если введено пустое значение
        if (!this.getRawValue() && this.getValue()) {
            this.clearValue();
        }
        this.validate();
	},

    /**
     * Проверка поля на корректность
     */
    validateField: function(value) {
        // поле неверно, если в него ввели текст, который не совпадает с выбранным текстом
        return (this.getRawValue() === this.getText());
    },

    /**
     * Отображение(скрытие) основных триггеров: Очистки, редактирования, выбора из справочника и выпадающего списка.
     * Поведение зависит от выбранного флага show
     */
    showTriggers: function(show){

        if (show){
            if (this.getValue()) {
                this.showClearBtn();
                this.showEditBtn();
            }
            if (!this.hideTriggerDictSelect){
                this.getTrigger(2).show();
            }
            if (!this.hideTriggerDropDown){
                this.getTrigger(1).show();
            }
        }else{
            this.hideClearBtn();
            this.hideEditBtn();
            this.getTrigger(2).hide();
            this.getTrigger(1).hide();
        }
    },

    /**
     * При изменении доступности поля, нужно также поменять доступность всех его кнопок
     */
    setDisabled: function(disabled){

        this.disableTriggers(disabled);
        Ext3.m3.AdvancedComboBox.superclass.setDisabled.call(this, disabled);

        // Отображаем триггеры при disabled=false, т.е. поле вновь активно.
        this.showTriggers(!disabled);
     },
     
    /**
     * При изменении доступности поля, нужно также поменять доступность всех его кнопок
     */
    setReadOnly: function(readOnly){
        var width = this.getWidth();
        this.disableTriggers(readOnly);
        Ext3.m3.AdvancedComboBox.superclass.setReadOnly.call(this, readOnly);
        if (readOnly){
            this.el.setWidth(width);
            if (this.wrap) this.wrap.setWidth(width);
        } else {

            this.showTriggers(!readOnly);

            this.onResize(width);
        }
    }
});

Ext3.reg('m3-select', Ext3.m3.AdvancedComboBox);
