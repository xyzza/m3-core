/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectGrid = Ext.extend(Ext.m3.GridPanel, {
	actionNewUrl: null
	,actionEditUrl: null
	,actionDeleteUrl: null
	,actionDataUrl: null
	,actionContextJson: null
	
	,rowIdName: null
	,allowPaging: true
	
	,constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.ObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	, initComponent: function(){
		Ext.m3.ObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
	}
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var scope = this;
	    Ext.Ajax.request({
	       url: this.actionNewUrl
	       ,params: this.actionContextJson || {}
	       ,success: function(res, opt){
		   		return scope.childWindowOpenHandler(res, opt);
		    }
	       ,failure: Ext.emptyFn
    	});
	}
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			baseConf[this.rowIdName] = this.getSelectionModel().getSelected().id;
			
			var scope = this;
		    Ext.Ajax.request({
		       url: this.actionEditUrl,
		       params: Ext.applyIf(baseConf, this.actionContextJson || {}),
		       success: function(res, opt){
			   		return scope.childWindowOpenHandler(res, opt);
			   },
		       failure: Ext.emptyFn
		    });
    	}
	}
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
	    Ext.Msg.show({
	        title: 'Удаление записи',
		    msg: 'Вы действительно хотите удалить выбранную запись?',
		    icon: Ext.Msg.QUESTION,
	        buttons: Ext.Msg.YESNO,
	        fn:function(btn,text,opt){ 
	            if (btn == 'yes') {
	                if (scope.getSelectionModel().hasSelection()) {
						var baseConf = {};
						baseConf[scope.rowIdName] = scope.getSelectionModel().getSelected().id;
			
		                Ext.Ajax.request({
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
						   	    return scope.deleteOkHandler(res, opt);
						   },
		                   failure: Ext.emptyFn
		                });
	                }
	            }
	        }
	    });
	}
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
});

