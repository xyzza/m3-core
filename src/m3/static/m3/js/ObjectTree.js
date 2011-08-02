/**
 * Объектное дерево, включает в себя тулбар с кнопками добавить (в корень и дочерний элемент), редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectTree = Ext.extend(Ext.ux.tree.TreeGrid, {
	constructor: function(baseConfig, params){
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		this.parentIdName = params.parentIdName; 
		if (params.customLoad) {
			var ajax = Ext.Ajax;
			this.on('expandnode',function (node){
				var nodeList = new Array();
				if (node.hasChildNodes()){
					for (var i=0; i < node.childNodes.length; i++){
						if(!node.childNodes[i].isLoaded()) {
							nodeList.push(node.childNodes[i].id);
						}	
					}
				}
				if (nodeList.length > 0) {
					ajax.request({
						url: params.actions.dataUrl
						,params: {'list_nodes': nodeList.join(',')}
						,success: function(response, opts){
							var res = Ext.util.JSON.decode(response.responseText);
							if (res) {
								for (var i=0; i < res.length; i++){
									var curr_node = node.childNodes[i];
									for (var j=0; j < res[i].children.length; j++){
										var newNode = new Ext.tree.AsyncTreeNode(res[i].children[j]);
										curr_node.appendChild(newNode);
										curr_node.loaded = true;
									}
								}
							} 
						}
						,failure: function(response, opts){
						   Ext.Msg.alert('','failed');
						}
					});
				}
			});
		}
		Ext.m3.ObjectTree.superclass.constructor.call(this, baseConfig, params);
	}
	,initComponent: function(){
		Ext.m3.ObjectTree.superclass.initComponent.call(this);
	}
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var scope = this;
	    Ext.Ajax.request({
	       url: this.actionNewUrl
	       ,method: 'POST'
	       ,params: this.getMainContext()
	       ,success: function(res, opt){
		   		return scope.childWindowOpenHandler(res, opt);
		    }
	       ,failure: Ext.emptyFn
    	});
	}
	,onNewRecordChild: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		if (!this.getSelectionModel().getSelectedNode()) {
			Ext.Msg.show({
			   title: 'Новый',
			   msg: 'Элемент не выбран',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.INFO
			});
			return;
		}
		var baseConf = this.getSelectionContext();
		baseConf[this.parentIdName] = baseConf[this.rowIdName];
		delete baseConf[this.rowIdName];
		var scope = this;
	    Ext.Ajax.request({
	       url: this.actionNewUrl
	       ,method: "POST"
	       ,params: baseConf
	       ,success: function(res, opt){
		   		return scope.childWindowOpenHandler(res, opt);
		    }
	       ,failure: Ext.emptyFn
    	});
	}
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().getSelectedNode()) {
			var baseConf = this.getSelectionContext();
			var scope = this;
		    Ext.Ajax.request({
		       url: this.actionEditUrl
		       ,method: 'POST'
		       ,params: baseConf
		       ,success: function(res, opt){
			   		return scope.childWindowOpenHandler(res, opt);
			   }
		       ,failure: Ext.emptyFn
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
	                if (scope.getSelectionModel().getSelectedNode()) {
						var baseConf = scope.getSelectionContext();
		                Ext.Ajax.request({
		                   url: scope.actionDeleteUrl,
		                   params: baseConf,
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
		this.getLoader().load(this.getRootNode());
	}
	/**
     * Получение основного контекста дерева
     * Используется при ajax запросах
     */
    ,getMainContext: function(){
    	return Ext.applyIf({}, this.getLoader().baseParams);
    }
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     * @param {bool} withRow Признак добавление в контекст текущей выбранной записи
     */
    ,getSelectionContext: function(withRow){
    	var baseConf = this.getMainContext();
    	if (this.getSelectionModel().getSelectedNode()) {
			baseConf[this.rowIdName] = this.getSelectionModel().getSelectedNode().id;
		}
		return baseConf;
    }
});

