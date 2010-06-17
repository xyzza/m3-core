{% extends 'ext-grids/ext-grid.js' %}

{% block code_extenders %}

function childWindowOpenHandler(response, opts){
    var window = smart_eval(response.responseText);
    if(window != undefined){
        window.on('closed_ok', function(){ refreshStore(); });
    }
}

function deleteOkHandler(response, opts){
	smart_eval(response.responseText);
	refreshStore();
}

function refreshStore(){
	{% if component.allow_paging %}
	var pagingBar = Ext.getCmp('{{self.paging_bar.client_id}}'); 
	if(pagingBar != undefined ){
	    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
        pagingBar.changePage(active_page);
	}
	{% else %}
	Ext.StoreMgr.get('{{self.store.client_id}}').load(); 
	{% endif %}
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
    if (grid.getSelectionModel().hasSelection()) {
	    Ext.Ajax.request({
	       url: '{{component.action_edit.absolute_url}}',
	       params: Ext.applyIf({ {{component.row_id_name}}: grid.getSelectionModel().getSelected().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}),
	       success: childWindowOpenHandler,
	       failure: function(){}
	    });
    }
}

function onDeleteRecord(){
    Ext.Msg.show({
        title: 'Удаление записи',
	    msg: 'Вы действительно хотите удалить выбранную запись?',
	    icon: Ext.Msg.QUESTION,
        buttons: Ext.Msg.YESNO,
        fn:function(btn,text,opt){ 
            if (btn == 'yes') {
                var grid = Ext.getCmp('{{component.client_id}}');
                if (grid.getSelectionModel().hasSelection()) {
	                Ext.Ajax.request({
	                   url: '{{component.action_delete.absolute_url}}',
	                   params: Ext.applyIf({ {{component.row_id_name}}: grid.getSelectionModel().getSelected().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}),
	                   success: deleteOkHandler,
	                   failure: function(){}
	                });
                }
            }
        }
    });
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
