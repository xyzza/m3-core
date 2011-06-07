/**
 * User: kirs
 * Date: 02.06.11
 * Time: 13:49
 */

var tree_entities = Ext.getCmp('{{ component.tree_entities.client_id }}');
var grd_selected_entities = Ext.getCmp('{{ component.grd_selected_entities.client_id }}');

/*Выбор связи*/
function selectConnection(){
    var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    
    Ext.Ajax.request({
        url: '{{component.params.select_connections_url}}'
        ,success: function(response){
            loadMask.hide();
            smart_eval(response.responseText);
        }
        ,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
    });
};

/*Удаление связи*/
function deleteConnection(){
    
}
/*Закрытие окна*/
function winClose(){
    win.close();
}

/**
 * D&d из дерева сущностей в выбранные сущности
 */
var selectEntityDropTargetEl = grd_selected_entities.getView().scroller.dom;
var selectEntityDropTarget = new Ext.dd.DropTarget(selectEntityDropTargetEl, {
    ddGroup    : 'TreeDD',
    notifyDrop : function(ddSource, e, data){                    
        var selectedStore = grd_selected_entities.getStore(),
        	entityId = data.node.id,
        	entityName = data.node.attributes['schemes'];
                
        
        var record = selectedStore.getById(entityId);
        if (!record && entityId && entityName){

			var EntityRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
			    {name: 'entityName', mapping: 'entityName'}
			]);
			
			
			var newEntityRecord = new EntityRecord(
			    {entityName: entityName},
			    entityId 
			);
        	selectedStore.add(newEntityRecord)
        	
        }                
        return true;
    }
});