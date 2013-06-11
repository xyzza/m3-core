/**
 * Компонент поля даты.
 * Добавлена кнопа установки текущий даты
 */
Ext3.m3.AdvancedDataField = Ext3.extend(Ext3.form.DateField, {
	constructor: function(baseConfig, params){

		// Базовый конфиг для тригеров
		this.baseTriggers = [
			{
				iconCls: 'x3-form-date-trigger'
				,handler: null
				,hide:null
			},
			{
				iconCls: 'x3-form-current-date-trigger'
				,handler: null
				,hide:null
			}
		];

		this.hideTriggerToday = false;


		if (params.hideTriggerToday) {
			this.hideTriggerToday = true;
		};

		Ext3.m3.AdvancedDataField.superclass.constructor.call(this, baseConfig);
	}
	,initComponent: function(){
		Ext3.m3.AdvancedDataField.superclass.initComponent.call(this);

        this.triggerConfig = {
            tag:'span', cls:'x3-form-twin-triggers', cn:[]};

		Ext3.each(this.baseTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext3.BLANK_IMAGE_URL, cls: "x3-form-trigger " + item.iconCls}
			);
		}, this);

		this.initBaseTrigger()
	},
	initTrigger : function(){

        var ts = this.trigger.select('.x3-form-trigger', true);
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

            if( this.baseTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this.baseTriggers[index].handler, this, {preventDefault:true});
            t.addClassOnOver('x3-form-trigger-over');
            t.addClassOnClick('x3-form-trigger-click');
        }, this);

        this.triggers = ts.elements;
    }
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClick;
		this.baseTriggers[1].handler = function(){
			var today = new Date();
			this.setValue( today );
			this.fireEvent('select', this, today);
		};
		this.baseTriggers[1].hide = this.hideTriggerToday;
	},
	onBlur : function(){
	/*
	   В суперклассе Ext.form.TriggerField данный метод перекрывается пустой функцией,
   	   видимо для того, чтобы все изменения и событие change происходили только при нажатии на триггеры,
 	   но данное поведение весьма неудобно в колоночных фильтрах, где требуется корректное срабатывание
           blur и change при потере фокуса.
	   Данная реализация метода взята из базового класса Ext.formField
	*/
	    this.beforeBlur();
	    if(this.focusClass){
	        this.el.removeClass(this.focusClass);
	    }
	    this.hasFocus = false;
	    if(this.validationEvent !== false && (this.validateOnBlur || this.validationEvent == 'blur')){
	        this.validate();
	    }
	    var v = this.getValue();
	    if(String(v) !== String(this.startValue)){
	        this.fireEvent('change', this, v, this.startValue);
	    }
	    this.fireEvent('blur', this);
	    this.postBlur();
    }

});

Ext3.reg('m3-date', Ext3.m3.AdvancedDataField );
