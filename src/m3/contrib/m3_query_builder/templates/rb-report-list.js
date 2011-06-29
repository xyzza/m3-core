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

	var url = '{{ component.report_form_url }}';
	assert(url, 'Url for child window is not define');

    Ext.Ajax.request({
        url: url
        ,params: Ext.applyIf({
        	'id': record.id
        },
        	win.actionContextJson || {})
        ,success: function(response){
            loadMask.hide();
            var childWin = smart_eval(response.responseText);
           
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});	
}
{% endblock %}