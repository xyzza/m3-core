/**
 * Интерпретирует js-строку в вызванном контексте.
 * @param {string} args Строка, которая будет передана параметровм в функцию eval
 * @return {Object} Отэваленый объект
 */
function m3_eval(args){
	var win = eval(args);
	if (win!=undefined) {
    	AppDesktop.getDesktop().createWindow(win);
	};
	return win;
};

function smart_eval(text){
	if( text == undefined ){
	    // на случай, когда в процессе получения ответа сервера произошел аборт
		return;
	}
	if(text[0] == '{'){
		// это у нас json объект
		var obj = Ext.util.JSON.decode(text);
		if(!obj){
			return;
		}
		if(obj.code != undefined){
			var eval_result = obj.code();
			if( eval_result != undefined && AppDesktop != undefined && eval_result instanceof Ext.Window ){
				AppDesktop.getDesktop().createWindow(eval_result);
			}
			return eval_result;
		}
		else
		{
    		if(obj.message != undefined && obj.message != ''){
    			Ext.Msg.show({title:'', msg: obj.message, buttons:Ext.Msg.OK, icon: (obj.success!=undefined && !obj.success ? Ext.Msg.WARNING : Ext.Msg.Info)});
    			return;
    		}
		}
	}
	else{
		var eval_result = eval(text);
		if( eval_result != undefined && AppDesktop != undefined && eval_result instanceof Ext.Window ){
			AppDesktop.getDesktop().createWindow(eval_result);
		}
		return eval_result;
	}
}

Ext.ns('Ext.app.form');
/**
 * Модифицированный контрол поиска, за основу был взят контрол от ui.form.SearchField
 * @class Ext.app.form.SearchField Контрол поиска
 * @extends Ext.form.TwinTriggerField Абстрактный классс как раз для разного рода таких вещей, типа контрола поиска
 */
Ext.app.form.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.app.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    }

    ,validationEvent:false
    ,validateOnBlur:false
    ,trigger1Class:'x-form-clear-trigger'
    ,trigger2Class:'x-form-search-trigger'
    ,hideTrigger1:true
    ,width:180
    ,hasSearch : false
    ,paramName : 'filter'
	,paramId: 'id'
	,nodeId:'-1'
    
    ,onTrigger1Click : function(e, html, arg){
        if(this.hasSearch){
        	this.el.dom.value = '';
        	var cmp = this.getComponentForSearch();
        	if (cmp.isXType('grid')) {
	            var o = {start: 0};
	            var store = cmp.getStore();
	            store.baseParams = store.baseParams || {};
	            store.baseParams[this.paramName] = '';
				store.baseParams[this.paramId] = this.nodeId || '';	
	            store.reload({params:o});

	        } else if (cmp.isXType('treegrid')) {
	        	this.el.dom.value = '';
	        	
	        	var loader = cmp.getLoader();
	        	loader.baseParams = loader.baseParams || {};
	        	loader.baseParams[this.paramName] = '';
	        	var rootNode = cmp.getRootNode();
	        	loader.load(rootNode);
	        	rootNode.expand();
	        };
	        this.triggers[0].hide();
	        this.hasSearch = false;
        }
    }

    ,onTrigger2Click : function(e, html, arg){
        var value = this.getRawValue();
        var cmp = this.getComponentForSearch();
        if (cmp.isXType('grid')) {
            var o = {start: 0};
            var store = cmp.getStore();
	        store.baseParams = store.baseParams || {};
	        store.baseParams[this.paramName] = value;
	        store.baseParams[this.paramId] = this.nodeId || '';	
	        store.reload({params:o});
        } else if (cmp.isXType('treegrid')) {
        	var loader = cmp.getLoader();
        	loader.baseParams = loader.baseParams || {};
	        loader.baseParams[this.paramName] = value;
        	var rootNode = cmp.getRootNode();
        	loader.load(rootNode);
        	rootNode.expand();
        	//console.log(rootNode);
        };
        if (value) {
        	this.hasSearch = true;
	    	this.triggers[0].show();
        }
    }
    
    ,clear : function(node_id){ this.onTrigger1Click() }
    ,search: function(node_id){ this.onTrigger2Click() }
});
/**
 * В поле добавим функционал отображения того, что оно изменено.
 */
Ext.override(Ext.form.Field, {
	isEdit: true, // признак, что поле используется для изменения значения, а не для навигации - при Истине будут повешаны обработчики на изменение окна
	isModified: false,
	updateLabel: function() {
		this.setFieldLabel(this.fieldLabel);
	},
	setFieldLabel : function(text) {
    	if (this.rendered) {
      		var newtext = text+':';
      		if (this.isModified) {newtext = '<span style="color:darkmagenta;">' + newtext + '</span>'; };
	  		//if (this.isModified) {newtext = '<span">*</span>' + newtext; };
			var lab = this.el.up('.x-form-item', 10, true);
			if (lab) {
				lab.child('.x-form-item-label').update(newtext);
			}
    	}
    	this.fieldLabel = text;
  	},
	// переопределим клавишу ENTER для применения изменений поля
	fireKey : function(e){
        if(e.isSpecialKey()){
			if (e.getKey() == e.ENTER) {
				// этот метод делает применение изменений
				this.onBlur();
			};
            this.fireEvent('specialkey', this, e);
        }
    },
});
