(function(){
	var baseConf = { {{ component.render_base_config|safe }} };
	var params = { {{ component.render_params|safe }} };
	
	baseConf = Ext.applyIf({
		store: {{ component.t_render_store|safe }}
	},baseConf);
	
	var objGrid = createObjectGrid(baseConf, params);

	function contextMenuNew(){ objGrid.onNewRecord(); }
	function contextMenuEdit(){ objGrid.onEditRecord(); }
	function contextMenuDelete(){ objGrid.onDeleteRecord(); }
	function contextMenuRefresh(){ objGrid.refreshStore(); }
	function topBarNew(){ objGrid.onNewRecord();}
	function topBarEdit(){ objGrid.onEditRecord();}
	function topBarDelete(){ objGrid.onDeleteRecord();}
	function topBarRefresh(){ objGrid.refreshStore(); }
	function onEditRecord(){ objGrid.onEditRecord(); }
	return objGrid;
})()
