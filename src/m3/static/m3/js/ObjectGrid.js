/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectGrid = Ext.extend(Ext.m3.GridPanel, {
	constructor: function(baseConfig, params){
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.ObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.ObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		var mask = new Ext.LoadMask(this.body);
		
		var req = {
			url: this.actionNewUrl,
			params: this.actionContextJson || {},
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
				    try { 
				        var child_win = scope.childWindowOpenHandler(res, opt);
				    } finally { 
    				    mask.hide();
    				    scope.disableToolbars(false);
				    }
					return child_win;
				}
				mask.hide();
				scope.disableToolbars(false);
			}
           ,failure: function(){ 
               uiAjaxFailMessage.apply(this, arguments);
               mask.hide();
               scope.disableToolbars(false);
               
           }
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;

			this.disableToolbars(true);
			mask.show();
			Ext.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			var sm = this.getSelectionModel();
			// для режима выделения строк
			if (sm instanceof Ext.grid.RowSelectionModel) {
				if (sm.singleSelect) {
					baseConf[this.rowIdName] = sm.getSelected().id;
				} else {
					// для множественного выделения
					var sels = sm.getSelections();
					var ids = [];
					for(var i = 0, len = sels.length; i < len; i++){
						ids.push(sels[i].id);
					}
					baseConf[this.rowIdName] = ids.join();
				}
			}
			// для режима выделения ячейки
			else if (sm instanceof Ext.grid.CellSelectionModel) {
				assert(this.columnParamName, 'columnParamName is not define');
				
				var cell = sm.getSelectedCell();
				if (cell) {
					var record = this.getStore().getAt(cell[0]); // получаем строку данных
					baseConf[this.rowIdName] = record.id;
					baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]); // получаем имя колонки
				}
			}
			
			var mask = new Ext.LoadMask(this.body);
			var req = {
				url: this.actionEditUrl,
				params: Ext.applyIf(baseConf, this.actionContextJson || {}),
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
					    try { 
						    var child_win = scope.childWindowOpenHandler(res, opt);
						} finally { 
    						mask.hide();
    						scope.disableToolbars(false);
						}
						return child_win;
					}
					mask.hide();
                    scope.disableToolbars(false);
				}
               ,failure: function(){ 
                   uiAjaxFailMessage.apply(this, arguments);
                   mask.hide();
                   scope.disableToolbars(false);
               }
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				this.disableToolbars(true);
				mask.show();
				Ext.Ajax.request(req);
			}
    	}
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext.Msg.QUESTION,
		        buttons: Ext.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = {};
						var sm = scope.getSelectionModel();
						// для режима выделения строк
						if (sm instanceof Ext.grid.RowSelectionModel) {
							if (sm.singleSelect) {
								baseConf[scope.rowIdName] = sm.getSelected().id;
							} else {
								// для множественного выделения
								var sels = sm.getSelections();
								var ids = [];
								for(var i = 0, len = sels.length; i < len; i++){
									ids.push(sels[i].id);
								}
								baseConf[scope.rowIdName] = ids.join();
							}
						}
						// для режима выделения ячейки
						else if (sm instanceof Ext.grid.CellSelectionModel) {
							assert(scope.columnParamName, 'columnParamName is not define');
							
							var cell = sm.getSelectedCell();
							if (cell) {
								var record = scope.getStore().getAt(cell[0]);
								baseConf[scope.rowIdName] = record.id;
								baseConf[scope.columnParamName] = scope.getColumnModel().getDataIndex(cell[1]);
							}
						}
						
						var mask = new Ext.LoadMask(scope.body);
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                	       try { 
		                		       var child_win =  scope.deleteOkHandler(res, opt);
		                		   } finally { 
    		                		   mask.hide();
    		                		   scope.disableToolbars(false);
    		                	   }
		                		   return child_win;
		                	   }
		                	   mask.hide();
                               scope.disableToolbars(false);
						   }
                           ,failure: function(){ 
                               uiAjaxFailMessage.apply(this, arguments);
                               mask.hide();
                               scope.disableToolbars(false);
                           }
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
						    scope.disableToolbars(true);
						    mask.show();
							Ext.Ajax.request(req);
						}
	                }
	            }
	        });
	    }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
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
	,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
});

Ext.m3.EditorObjectGrid = Ext.extend(Ext.m3.EditorGridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.EditorObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.EditorObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var req = {
			url: this.actionNewUrl,
			params: this.actionContextJson || {},
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
					return scope.childWindowOpenHandler(res, opt);
				}
			},
			failure: Ext.emptyFn
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;
			Ext.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			var sm = this.getSelectionModel();
			// для режима выделения строк
			if (sm instanceof Ext.grid.RowSelectionModel) {
				if (sm.singleSelect) {
					baseConf[this.rowIdName] = sm.getSelected().id;
				} else {
					// для множественного выделения
					var sels = sm.getSelections();
					var ids = [];
					for(var i = 0, len = sels.length; i < len; i++){
						ids.push(sels[i].id);
					}
					baseConf[this.rowIdName] = ids;
				}
			}
			// для режима выделения ячейки
			else if (sm instanceof Ext.grid.CellSelectionModel) {
				assert(this.columnParamName, 'columnParamName is not define');
				
				var cell = sm.getSelectedCell();
				if (cell) {
					var record = this.getStore().getAt(cell[0]); // получаем строку данных
					baseConf[this.rowIdName] = record.id;
					baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]); // получаем имя колонки
				}
			}
			var req = {
				url: this.actionEditUrl,
				params: Ext.applyIf(baseConf, this.actionContextJson || {}),
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
						return scope.childWindowOpenHandler(res, opt);
					}
				},
				failure: Ext.emptyFn
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				Ext.Ajax.request(req);
			}
    	}
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext.Msg.QUESTION,
		        buttons: Ext.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = {};
						var sm = scope.getSelectionModel();
						// для режима выделения строк
						if (sm instanceof Ext.grid.RowSelectionModel) {
							if (sm.singleSelect) {
								baseConf[scope.rowIdName] = sm.getSelected().id;
							} else {
								// для множественного выделения
								var sels = sm.getSelections();
								var ids = [];
								for(var i = 0, len = sels.length; i < len; i++){
									ids.push(sels[i].id);
								}
								baseConf[scope.rowIdName] = ids;
							}
						}
						// для режима выделения ячейки
						else if (sm instanceof Ext.grid.CellSelectionModel) {
							assert(scope.columnParamName, 'columnParamName is not define');
							
							var cell = sm.getSelectedCell();
							if (cell) {
								var record = scope.getStore().getAt(cell[0]);
								baseConf[scope.rowIdName] = record.id;
								baseConf[scope.columnParamName] = scope.getColumnModel().getDataIndex(cell[1]);
							}
						}
						
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                		   return scope.deleteOkHandler(res, opt);
		                	   }
						   },
		                   failure: Ext.emptyFn
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
							Ext.Ajax.request(req);
						}
	                }
	            }
	        });
	    }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
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