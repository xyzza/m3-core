
var hdnID = Ext.getCmp('{{ component.hdn_id.client_id }}');
var strParamName = Ext.getCmp('{{ component.str_param_name.client_id }}');

var comboValueType = Ext.getCmp('{{ component.cmb_value_type.client_id }}');
var comboType = Ext.getCmp('{{ component.cmb_type.client_id }}');

// Первоначальные размеры окна
var preHeightWin = '{{ component.height }}';

win.on('loadData', function(obj){
	hdnID.setValue(obj['id']);
	strParamName.setValue(obj['name']);
	
	comboType.setValue(obj['type']);
	if (obj['value']){
		
		win.setHeight( parseInt(preHeightWin) + 30); // 30 - ширина одного контрола
		comboValueType.setVisible(true);
		
		
		loadData(obj['type'], function(){			
			// Выполняется после успешного выполнения Ajax запроса
			comboValueType.setValue(obj['value']);	
		});		
	}	
});

function loadData(typeValue, func){
	// Получить все паки в проекте
	Ext.Ajax.request({
		url: '{{component.params.get_packs_url }}'
		,params: {
			'type': typeValue				
		}
		,success: function(response){								
			var jsonData = Ext.decode(response.responseText);
			if (jsonData['success']){
				comboValueType.getStore().loadData(jsonData['data']);
				
				if (func instanceof Function){
					func();
				}
			}
		}
		,failure: uiAjaxFailMessage
	});		
}

comboType.on('select', function(combo, record, index){	
	var dictValue = '{{ component.dict_value }}';	
	
	if (record.get('id') == dictValue){
		win.setHeight( parseInt(preHeightWin) + 30); // 30 - ширина одного контрола
		comboValueType.setVisible(true);
		
		loadData(dictValue);
		
	} else {
		win.setHeight( parseInt(preHeightWin) );
		comboValueType.setVisible(false);
		comboValueType.getStore().removeAll();
	}
});

// Обработчик кнопки "Ок" - выбрать значения
function selectType(){
	win.fireEvent('selectData', {
		'typeID': comboType.getValue(),
		'typeName': comboType.lastSelectionText, 
		'valueID': comboValueType.getValue(),
		'valueName':  comboValueType.lastSelectionText
	});
	win.close();
}

// По-умолчанию свойство скрыто
comboValueType.setVisible(false);
