(function(){
	var dataRecord = Ext3.data.Record.create([
		{{ component.t_render_fields|safe }}
	]);
	
	var dataReader = new Ext3.data.ArrayReader({
	    idIndex: 0
	}, dataRecord);
	
	var data_store = new Ext3.data.Store({
		reader: dataReader
		,data: [{{ component.t_render_data|safe }}]
	});
	
	return data_store;
})()