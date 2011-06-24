
var hdnID = Ext.getCmp('{{ component.hdn_id.client_id }}');
var edtQueryName = Ext.getCmp('{{ component.str_name.client_id }}');

var dictQuery = Ext.getCmp('{{ component.dsf_query.client_id }}');
var grdParams = Ext.getCmp('{{ component.grd_params.client_id }}');

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
function save(){
	console.log('save');
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
