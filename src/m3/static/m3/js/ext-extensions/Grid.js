/**
 * Расширенный грид на базе Ext3.grid.GridPanel
 * @param {Object} config
 */
Ext3.m3.GridPanel = Ext3.extend(Ext3.grid.GridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		// Добавлене selection model если нужно
		var selModel = params.selModel;
		var gridColumns = params.colModel || [];
		if (selModel && selModel instanceof Ext3.grid.CheckboxSelectionModel) {
			gridColumns.columns.unshift(selModel);
		}
		
		// Навешивание обработчиков на контекстное меню если нужно 
		var funcContMenu;
		if (params.menus.contextMenu && 
			params.menus.contextMenu instanceof Ext3.menu.Menu) {
			
			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
			funcContMenu = Ext3.emptyFn;
		}
		
		var funcRowContMenu;
		if (params.menus.rowContextMenu && 
			params.menus.rowContextMenu instanceof Ext3.menu.Menu) {
			
			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
				if (!this.getSelectionModel().isSelected(index)) {
						this.getSelectionModel().selectRow(index);
				};
                params.menus.rowContextMenu.showAt(e.getXY())
			}
		} else {
			funcRowContMenu = Ext3.emptyFn;
		}
		
		var plugins = params.plugins || [];
		var bundedColumns = params.bundedColumns;
		if (bundedColumns && bundedColumns instanceof Array &&
			bundedColumns.length > 0) {

			plugins.push( 
				new Ext3.ux.grid.ColumnHeaderGroup({
					rows: bundedColumns
				})
			);
		}
		
		// объединение обработчиков
		baseConfig.listeners = Ext3.applyIf({
			contextmenu: funcContMenu
			,rowcontextmenu: funcRowContMenu
			,beforerender: function(){
				var bbar = this.getBottomToolbar();
				if (bbar && bbar instanceof Ext3.PagingToolbar){
					var store = this.getStore();
					store.setBaseParam('start',0);
					store.setBaseParam('limit',bbar.pageSize);
					bbar.bind(store);
				}
			}	
		}
		,baseConfig.listeners || {});

		var config = Ext3.applyIf({
			sm: selModel
			,colModel: gridColumns
			,plugins: plugins
		}, baseConfig);
		
		Ext3.m3.GridPanel.superclass.constructor.call(this, config);
	}
	,initComponent: function(){
		Ext3.m3.GridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		uiAjaxFailMessage(response, options);
	}
});

Ext3.m3.EditorGridPanel = Ext3.extend(Ext3.grid.EditorGridPanel, {
  constructor: function(baseConfig, params){
//    console.log(baseConfig);
//    console.log(params);
    
    // Добавлене selection model если нужно
    var selModel = params.selModel;
    var gridColumns = params.colModel || [];
    if (selModel && selModel instanceof Ext3.grid.CheckboxSelectionModel) {
      gridColumns.columns.unshift(selModel);
    }
    
    // Навешивание обработчиков на контекстное меню если нужно 
    var funcContMenu;
    if (params.menus.contextMenu && 
      params.menus.contextMenu instanceof Ext3.menu.Menu) {
      
      funcContMenu = function(e){
        e.stopEvent();
              params.menus.contextMenu.showAt(e.getXY())
      }
    } else {
      funcContMenu = Ext3.emptyFn;
    }
    
    var funcRowContMenu;
    if (params.menus.rowContextMenu && 
      params.menus.contextMenu instanceof Ext3.menu.Menu) {
      
      funcRowContMenu = function(grid, index, e){
        e.stopEvent();
                this.getSelectionModel().selectRow(index);
                params.menus.rowContextMenu.showAt(e.getXY())
      }
    } else {
      funcRowContMenu = Ext3.emptyFn;
    }
    
    var plugins = params.plugins || [];
    var bundedColumns = params.bundedColumns;
    if (bundedColumns && bundedColumns instanceof Array &&
      bundedColumns.length > 0) {

      plugins.push( 
        new Ext3.ux.grid.ColumnHeaderGroup({
          rows: bundedColumns
        })
      );
    }
    
    // объединение обработчиков
    baseConfig.listeners = Ext3.applyIf({
      contextmenu: funcContMenu
      ,rowcontextmenu: funcRowContMenu
      ,beforerender: function(){
        var bbar = this.getBottomToolbar();
        if (bbar && bbar instanceof Ext3.PagingToolbar){
          var store = this.getStore();
          // Оставлено, так как разработчик может поменять pageSize и новое значение
          // может быть не равно limit-у.
          store.setBaseParam('limit',bbar.pageSize);
          bbar.bind(store);
        }
      } 
    }
    ,baseConfig.listeners || {});

    var config = Ext3.applyIf({
      sm: selModel
      ,colModel: gridColumns
      ,plugins: plugins
    }, baseConfig);
    
    Ext3.m3.EditorGridPanel.superclass.constructor.call(this, config);
  }
	,initComponent: function(){
		Ext3.m3.EditorGridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		if (type == 'remote' && action != Ext3.data.Api.actions.read) {
		  if (response.raw.message) {
  		  Ext3.Msg.show({
  		    title: 'Внимание!',
  		    msg: response.raw.message,
  		    buttons: Ext3.Msg.CANCEL,
  		    icon: Ext3.Msg.WARNING
  		  });
  		};
		} else {
		  uiAjaxFailMessage(response, options);
		};
	}
});