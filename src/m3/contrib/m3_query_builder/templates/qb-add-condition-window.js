
var condField = Ext.getCmp('{{ component.str_item.client_id }}');
var condParam = Ext.getCmp('{{ component.str_param.client_id }}');
var condition = Ext.getCmp('{{ component.cmb_simple_cond.client_id }}');


win.on('loadData', function(obj){
	condField.setValue(obj['verboseName']);
	condParam.setValue(obj['paramName']);
});

function selectCondition(){
	win.fireEvent('selectData', {
		'condition': condition.lastSelectionText,
		'parameter': condParam.getValue()
	});
	
	win.close(true);
}
