{% extends 'ext-script/ext-dictionary-window-globals.js' %}

{% block content %}
/*
 * Открывает форму выбранного отчета
 */
function openReportForm(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	var record =  grid.getSelectionModel().getSelected();
	if (!record) {
		Ext.Msg.show({
		   title:'Внимание',
		   msg: 'Не выбран отчет',
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
            	'type': record.get('type_id'),
            	'value': record.get('value_type_id')
            });
            childWin.on('selectData', function(obj){
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
{% endblock %}