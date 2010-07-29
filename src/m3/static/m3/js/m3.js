/**
 * Содержит общие функции вызываемые из разных частей
 */
Ext.QuickTips.init();

/**
 * Чтобы ie и прочие не правильные браузеры, где нет console не падали
 */
if (typeof console == "undefined") var console = { log: function() {} };

Ext.namespace('Ext.m3');


var SOFTWARE_NAME = 'Платформа М3';

/**
 *  Реализация стандартного assert
 * @param {Boolean} condition
 * @param {Str} errorMsg
 */
function assert(condition, errorMsg) {
  if (!condition) {
      console.error(errorMsg);
      throw new Error(errorMsg);
  }
}

/**
 * 
 * @param {Object} text
 */
function smart_eval(text){
	if( text == undefined ){
	    // на случай, когда в процессе получения ответа сервера произошел аборт
		return;
	}
	if(text.substring(0,1) == '{'){
		// это у нас json объект
		var obj = Ext.util.JSON.decode(text);
		if(!obj){
			return;
		}
		if(obj.code){
			var eval_result = obj.code();
			if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
				AppDesktop.getDesktop().createWindow(eval_result);
			}
			return eval_result;
		}
		else
		{
    		if(obj.message && obj.message != ''){
    			Ext.Msg.show({title:'', msg: obj.message, buttons:Ext.Msg.OK, icon: (obj.success!=undefined && !obj.success ? Ext.Msg.WARNING : Ext.Msg.Info)});
    			return;
    		}
		}
	}
	else{
		var eval_result = eval(text);
		if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
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
        	if (cmp instanceof Ext.grid.GridPanel) {
	            var o = {start: 0};
	            var store = cmp.getStore();
	            store.baseParams = store.baseParams || {};
	            store.baseParams[this.paramName] = '';
				store.baseParams[this.paramId] = this.nodeId || '';	
	            store.reload({params:o});

	        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
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
        if (cmp instanceof Ext.grid.GridPanel) {
            var o = {start: 0};
            var store = cmp.getStore();
	        store.baseParams = store.baseParams || {};
	        store.baseParams[this.paramName] = value;
	        store.baseParams[this.paramId] = this.nodeId || '';	
	        store.reload({params:o});
        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
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
    }
});

/**
 * Создаётся новый компонент: Панель с возможностью включения в заголовок
 * визуальных компонентов.
 */
Ext.app.TitlePanel = Ext.extend(Ext.Panel, {
   titleItems: null,
   addTitleItem: function (itemConfig) { 
       var item = Ext.ComponentMgr.create(itemConfig);
       var itemsDiv = Ext.DomHelper.append(this.header, {tag:"div", style:"float:right;margin-top:-4px;margin-left:3px;"}, true);
       item.render(itemsDiv);
   },
   onRender: function (ct, position) {
       Ext.app.TitlePanel.superclass.onRender.apply(this, arguments);
       if (this.titleItems != null) {
           if(Ext.isArray(this.titleItems)){
               for (var i = this.titleItems.length-1; i >= 0 ; i--) {
                   this.addTitleItem(this.titleItems[i]);
               }
           } else {
               this.addTitleItems(this.titleItems);
           }
           
           if (this.header)
               this.header.removeClass('x-unselectable');
       };
   },
   getChildByName: function (name) {
       if (this.items)
           for (var i = 0;  i < this.items.length; i++)
               if (this.items.items[i].name == name)
                   return this.items.items[i];

       if (this.titleItems)
           for (var i = 0; i < this.titleItems.length; i++)
               if (this.titleItems[i].name == name)
                   return this.titleItems[i];

       return null;
    }
});


/*
 * выполняет обработку failure response при submit пользовательских форм
 * context.action -- объект, передаваемый из failure handle
 * context.title -- заголовок окон с сообщением об ошибке
 * context.message -- текст в случае, если с сервера на пришло иного сообщения об ошибке
 */
function uiFailureResponseOnFormSubmit(context){
    if(context.action.failureType=='server'){
        obj = Ext.util.JSON.decode(context.action.response.responseText);
        Ext.Msg.show({title: context.title,
                      msg: obj.error_msg,
                      buttons: Ext.Msg.OK,
                      icon: Ext.Msg.WARNING});
    }else{
        Ext.Msg.alert(context.title, context.message);
    }
}

// Стандартное окно отображаемое если не удалось получить ответ от сервера по неизвестной причине
function uiAjaxFailMessage(){
	Ext.Msg.alert(SOFTWARE_NAME, 'Извините, сервер временно не доступен.');
}

// Проверяет есть ли в ответе сообщение и выводит его
// Возвращает серверный success
function uiShowErrorMessage(response){
	obj = Ext.util.JSON.decode(response.responseText);
	if (obj.error_msg)
		Ext.Msg.alert(SOFTWARE_NAME, obj.error_msg);
	if (obj.code)
		alert('Пришел код на выполнение ' + obj.code);
	return obj.success;
}
