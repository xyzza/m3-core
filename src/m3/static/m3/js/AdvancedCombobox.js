/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */
Ext.m3.AdvancedComboBox = Ext.extend(Ext.form.ComboBox,{
	
	// Будет ли задаваться вопрос перед очисткой значения
	askBeforeDeleting: true
	
	,actionSelectUrl: null
	,actionEditUrl: null
	,actionContextJson: null
	
	,hideBaseTrigger: false
	
	,defaultValue: null
	,defaultText: null
	
	// кнопка очистки
	,hideTrigger1: false
	
	// кнопка выбора из выпадающего списка
	,hideTrigger2: false
	
	// кнопка выбора из справочника
	,hideTrigger3: false
	
	// кнопка редактирования элемента
	,hideTrigger4: false
	
	// Количество записей, которые будут отображаться при нажатии на кнопку 
	// выпадающего списка
	,defaultLimit: 50
	
	// css классы для иконок на триггеры 
	,trigger1Class:'x-form-select-trigger'
    ,trigger2Class:'x-form-clear-trigger'
	,trigger3Class:'x-form-edit-trigger'
	
	,constructor: function(baseConfig, params){
		//console.log(baseConfig);
		//console.log(params);
		
		assert(params.actions, 'params.actions is undefined');
		
		if (params.actions.actionSelectUrl) {
			this.actionSelectUrl = params.actions.actionSelectUrl
		}
		
		if (params.actions.actionEditUrl) {
			this.actionEditUrl = params.actions.actionEditUrl;
		}
		
		this.askBeforeDeleting = params.askBeforeDeleting;
		this.actionContextJson = params.actions.actionContextJson;
		this.hideBaseTrigger = params.hideTrigger;

		this.defaultValue = params.defaultValue;
		this.defaultText = params.defaultText;
		
		var config = Ext.applyIf({
			//
		}, baseConfig);
		
		Ext.m3.AdvancedComboBox.superclass.constructor.call(this, config);
	}
	/**
	 * Конфигурация компонента 
	 */
	,initComponent: function () {
		Ext.m3.AdvancedComboBox.superclass.initComponent.call(this);
		
		// см. TwinTriggerField
        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + this.trigger2Class},
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + this.triggerClass},
	            {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + this.trigger1Class},
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + this.trigger3Class}
	        ]};

		if (!this.actionSelectUrl) {
			this.hideTrigger3 = true;
		}
		
		if (!this.actionEditUrl) {
			this.hideTrigger4 = true;
		}
		if ( !this.getValue() ) {
			this.hideTrigger1 = true;
		}
		if (this.hideBaseTrigger){
			this.hideTrigger2 = true;
		}
	
		// Значения по-умолчанию
		if (this.defaultValue && this.defaultText) {
			this.addRecordToStore(this.defaultValue, this.defaultText);
		}

		//this.on('afterrender', this.onAfterRender);
	}
	// см. TwinTriggerField
	,getTrigger : function(index){
        return this.triggers[index];
    },
	// см. TwinTriggerField
    initTrigger : function(){
        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
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

            if(this['hide'+triggerIndex]){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this['on'+triggerIndex+'Click'], this, {preventDefault:true});
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);
        this.triggers = ts.elements;
    },
	// см. TwinTriggerField
    getTriggerWidth: function(){
        var tw = 0;
        Ext.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();
            if(w === 0 && !this['hidden' + triggerIndex]){
                tw += this.defaultTriggerWidth;
            }else{
                tw += w;
            }
        }, this);
        return tw;
    },
	// см. TwinTriggerField
    // private
    onDestroy : function() {
        Ext.destroy(this.triggers);
        Ext.m3.AdvancedComboBox.superclass.onDestroy.call(this);
    }

	/**
	 * Вызывает метод выпадающего меню у комбобокса
	 */
	,onTrigger2Click: function() {
		if (this.fireEvent('beforerequest', this)) {
			var baseParams = Ext.applyIf({start:0, limit: this.defaultLimit }, this.getStore().baseParams )
			this.getStore().load({
				params: baseParams
			});
			this.onTriggerClick();
		}
	}
	/**
	 * Кнопка открытия справочника в режиме выбора
	 */
	,onTrigger3Click: function() {
		this.onSelectInDictionary();
	}
	/**
	 * Кнопка очистки значения комбобокса
	 */
	,onTrigger1Click: function() {
		
		if (this.askBeforeDeleting) {
			var scope = this;
			Ext.Msg.show({
	            title: 'Подтверждение',
	            msg: 'Вы действительно хотите очистить выбранное значение?',
	            icon: Ext.Msg.QUESTION,
	            buttons: Ext.Msg.YESNO,
	            fn:function(btn,text,opt){ 
	                if (btn == 'yes') {
	                    scope.clearValue(); 
	                };
	            }
	        });	
		} else {
			this.clearValue();
		}
	}
	/**
	 * Кнопка открытия режима редактирования записи
	 */
	,onTrigger4Click: function() {
		this.onEditBtn();
	}
	/**
	 * При выборе значения необходимо показывать кнопку "очистить"
	 * @param {Object} record
	 * @param {Object} index
	 */
	,onSelect: function(record, index){
		if (this.fireEvent('afterselect', this, record.data[this.valueField], record.data[this.displayField] )) {
			Ext.m3.AdvancedComboBox.superclass.onSelect.call(this, record, index);
			this.showClearBtn();
			this.fireEvent('change', this, record.data[this.valueField || this.displayField]);
			this.fireEvent('changed', this);
		}
	}
	/**
	 * Показывает кнопку очистки значения
	 */
	,showClearBtn: function(){
		this.getTrigger(0).show();
	}
	/**
	 * Скрывает кнопку очистки значения
	 */
	,hideClearBtn: function(){
		this.getTrigger(0).hide();
	}
	/**
	 * Перегруженный метод очистки значения, плюс ко всему скрывает 
	 * кнопку очистки
	 */
	,clearValue: function(){
		Ext.m3.AdvancedComboBox.superclass.clearValue.call(this);
		this.hideClearBtn();
		
		this.fireEvent('change', this, '');
		this.fireEvent('changed', this);
	}
	/**
	 * Перегруженный метод установки значения, плюс ко всему отображает 
	 * кнопку очистки
	 */
	,setValue: function(value){
		Ext.m3.AdvancedComboBox.superclass.setValue.call(this, value);
		if (value) {
			if (this.rendered) {
				this.showClearBtn();
			} else {
				this.hideTrigger1 = true;
			}
		}
	}
	/**
	 * Генерирует ajax-запрос за формой выбора из справочника и
	 * вешает обработку на предопределенное событие closed_ok
	 */
	,onSelectInDictionary: function(){
		assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );
		
		if(this.fireEvent('beforerequest', this)) { 
			var scope = this;
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,params: this.actionContextJson
				,success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
				        win.on('closed_ok',function(id, displayText){
							if (scope.fireEvent('afterselect', scope, id, displayText)) {
								scope.addRecordToStore(id, displayText);
							}
							
				        });
				    };
				}
				,failure: function(response, opts){
					uiAjaxFailMessage();
				}
			});
		}
	}
	/**
	 * Добавляет запись в хранилище и устанавливает ее в качестве выбранной
	 * @param {Object} id Идентификатор
	 * @param {Object} value Отображаемое значение
	 */
	,addRecordToStore: function(id, value){
    	var record = new Ext.data.Record();
    	record['id'] = id;
    	record[this.displayField] = value;
		this.getStore().loadData({total:1, rows:[record]});    	
		this.setValue(id);
		this.collapse()
		
		this.fireEvent('change', this, id, '');
		this.fireEvent('changed', this);
	}
	/**
	 * Обработчик вызываемый по нажатию на кнопку редактирования записи
	 */
	,onEditBtn: function(){
		assert( this.actionEditUrl, 'actionEditUrl is undefined' );
		
		Ext.Ajax.request({
			url: this.actionEditUrl
			,params: this.actionContextJson
			,success: function(response, opts){
			    smart_eval(response.responseText);
			}
			,failure: function(response, opts){
				uiAjaxFailMessage();
			}
		});
	}
	/**
	 * Не нужно вызывать change после потери фокуса
	 */
	,triggerBlur: Ext.emptyFn
});
