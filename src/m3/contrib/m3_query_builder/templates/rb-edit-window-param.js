
var hdnID = Ext.getCmp('{{ component.hdn_id.client_id }}');
var strParamName = Ext.getCmp('{{ component.str_param_name.client_id }}');

var comboValueType = Ext.getCmp('{{ component.cmb_value_type.client_id }}');
var comboType = Ext.getCmp('{{ component.cmb_type.client_id }}');


win.on('loadData', function(obj){
	hdnID.setValue(obj['id']);
	strParamName.setValue(obj['name']);
});


comboType.on('select', function(combo, record, index){	
	var dictValue = '{{ component.dict_value }}';
	var preHeightWin = '{{ component.height }}';
	
	if (record.get('id') == dictValue){
		win.setHeight( parseInt(preHeightWin) + 30);
		comboValueType.setVisible(true);
	} else {
		win.setHeight( parseInt(preHeightWin) );
		comboValueType.setVisible(false);
	}
});

function selectType(){
	
}

// По-умолчанию свойство скрыто
comboValueType.setVisible(false);
