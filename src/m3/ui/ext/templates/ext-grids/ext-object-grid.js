{% extends 'ext-grids/ext-grid.js' %}

{% block code_extenders %}

function childWindowOpenHandler(response, opts){
    var window = smart_eval(response.responseText);
    if(window != undefined){
        window.on('closed_ok', function(){ refreshStore(); });
    }
}

function refreshStore(){
	// TODO: (akvarats) сделать рефреш стора у грида
}

function getLoadMask(){
    var mask = Ext.LoadMask(Ext.getCmp('{{component.client_id}}'),{msg:'Загрузка...', removeMask: true});
    return mask;
};

function onNewRecord(){
	//var mask = getLoadMask();
    Ext.Ajax.request({
       url: '{{component.action_new.absolute_url}}',
       params: Ext.applyIf({},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}),
       success: childWindowOpenHandler,
       failure: function(){/*mask.hide();*/}
    }); 
}

function onEditRecord(){
    var grid = Ext.getCmp('{{component.client_id}}');
    Ext.Ajax.request({
       url: '{{component.action_edit.absolute_url}}',
       params: Ext.applyIf({ {{component.row_id_name}}: grid.getSelectionModel().getSelected().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}),
       success: childWindowOpenHandler,
       failure: function(){}
    });
}

function onDeleteRecord(){
	// TODO: (akvarats) сделать удаление записей
}

function contextMenuNew(){ onNewRecord(); }
function contextMenuEdit(){ onEditRecord(); }
function contextMenuDelete(){ onDeleteRecord(); }
function contextMenuRefresh(){ refreshStore(); }
function topBarNew(){onNewRecord();}
function topBarEdit(){onEditRecord();}
function topBarDelete(){onDeleteRecord();}
function topBarRefresh(){ refreshStore(); }

{% endblock %}
