(function(){
	var baseConf = { {{ component.t_render_base_config|safe }} };
	var params = { {{ component.t_render_params|safe }} };
	var multiGroupingGrid = new Ext.m3.MultiGroupingGridPanel(baseConf, params);
	return multiGroupingGrid;
})()
