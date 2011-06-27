
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
	
	//win.actionContextJson = Ext.applyIf({'query_id': dictQuery.getValue()}, this.actionContextJson || {})
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
    
    console.log(record.get('name'));
    
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
            	'id': record.id,
            	'name': record.get('name')
            });
            // childWin.on('selectData', function(obj){
// 
         		// var Record = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
				    // {name: 'fieldName', mapping: 'fieldName'},
				    // {name: 'entityName', mapping: 'entityName'},
				    // {name: 'condition', mapping: 'condition'},
				    // {name: 'parameter', mapping: 'parameter'},
				    // {name: 'expression', mapping: 'expression'},
				// ]);
// 			
				// var fieldName = node.attributes['verbose_field'];
				// var entityName = node.attributes['entity_name'];
				// var fieldID = node.attributes['id_field'];
// 				
				// var condition = obj['condition'];
				// var parameter = obj['parameter'];
// 				
				// var newRecord = new Record(
				    // {'fieldName': fieldName,
				    // 'entityName': entityName,
				    // 'condition':condition,
				    // 'parameter':parameter,
				    // 'expression': String.format('{0} {1} {2}', fieldName, condition, parameter)
				   // },
				   // String.format('{0}-{1}', entityName, fieldID) 				    
				// );
				// grdConditionsFields.getStore().add(newRecord);
// 				
            // });		            
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});	
	
}