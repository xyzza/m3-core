
var hdnID = Ext.getCmp('{{ component.hdn_id.client_id }}');
var edtQueryName = Ext.getCmp('{{ component.str_name.client_id }}');

var dictQuery = Ext.getCmp('{{ component.dsf_query.client_id }}');
var grdParams = Ext.getCmp('{{ component.grd_params.client_id }}');

var form = Ext.getCmp('{{ component.frm_form.client_id }}');

// Обработчик на изменение значения в выборе запроса
dictQuery.on('change', function(field, newValue, oldValue){
	if (newValue) { 
		getParams(newValue);
	} else {
		grdParams.getStore().removeAll();
	}
});

/*
 * Сохранение карточки
 */
function submitForm(){
	
	res = [];
	var range = grdParams.getStore().getRange();
	for (var i=0; i<range.length; i++){
		res.push({
			'name': range[i].get('name'),
			'verbose_name': range[i].get('verbose_name'),
			'type': range[i].get('type_id'),
			'type_value': range[i].get('value_type_id'),
		});
	}

	win.actionContextJson = Ext.applyIf({'grid': Ext.encode(res)}, this.actionContextJson || {})
	win.submitForm();
}

/*
 * Получает и присваивает гриду параметры
 */
function getParams(queryID){
	var url = '{{ component.params.query_params_url }}';
	assert(url, 'Url for child window is not define');
	
	var loadMask = new Ext.LoadMask(win.body);
	loadMask.show();
			
	Ext.Ajax.request({
		url: url
		,params: {
			'query_id': queryID
		}
		,success: function(response, opt){
			loadMask.hide();
			
			var records = Ext.decode(response.responseText);
			var data = [];
			for (var i=0; i<records.length; i++){
				data.push([records[i].name, records[i].name]);
			}

			grdParams.getStore().loadData(data)						
		}
		,failure: function(){
			loadMask.hide();
			uiAjaxFailMessage.apply(this, arguments);
		}
	});
}

/**
 * Открывает окно редактирования параметров
 */
function editParamWindow(node){
	
	var url = '{{ component.params.edit_window_params_url }}';
	assert(url, 'Url for child window is not define');
	
	
	var record =  grdParams.getSelectionModel().getSelected();
	if (!record) {
		Ext.Msg.show({
		   title:'Внимание',
		   msg: 'Не выбран параметр',
		   buttons: Ext.Msg.OK,
		   animEl: 'elId',
		   icon: Ext.MessageBox.WARNING
		});
		
		return;
	}
	
	
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();

    Ext.Ajax.request({
        url: url
        ,params: Ext.applyIf({
        	'id': record.id
        },
        	win.actionContextJson || {})
        ,success: function(response){
            loadMask.hide();
            var childWin = smart_eval(response.responseText);
            childWin.fireEvent('loadData', {
            	'id': record.get('name'),
            	'name': record.get('name'),
            	'verboseName': record.get('verbose_name') || record.get('name'),
            	'type': record.get('type_id'),
            	'value': record.get('value_type_id')
            });
            childWin.on('selectData', function(obj){
				
				record.set('verbose_name', obj['verboseName']);
				record.set('type', obj['typeName']);
				record.set('type_id', obj['typeID']);
				record.set('value_type', obj['valueName']);
				record.set('value_type_id', obj['valueID']);
         		record.commit();				
            });		            
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});	
	
}