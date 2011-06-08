/**
 * User: kirs
 * Date: 02.06.11
 * Time: 13:49
 */

var treeEntities = Ext.getCmp('{{ component.tree_entities.client_id }}');
var grdSelectedEntities = Ext.getCmp('{{ component.grd_selected_entities.client_id }}');

var treeAllFields = Ext.getCmp('{{ component.tree_all_fields.client_id }}');
var treeGroupsFields = Ext.getCmp('{{ component.tree_groups_fields.client_id }}');
var treeConditionsFields = Ext.getCmp('{{ component.tree_conditions_fields.client_id }}');

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
var selectEntityDropTargetEl = grdSelectedEntities.getView().scroller.dom;
var selectEntityDropTarget = new Ext.dd.DropTarget(selectEntityDropTargetEl, {
    ddGroup    : 'TreeDD',
    notifyDrop : function(ddSource, e, data){                    
        var selectedStore = grdSelectedEntities.getStore(),
        	entityId = data.node.id,
        	entityName = data.node.attributes['schemes'];
                
        
        var record = selectedStore.getById(entityId);
        if (!record && entityId && entityName){


			var url = '{{ component.params.entity_items_url }}';
			assert(url, 'Url for child window is not define');

			var loadMask = new Ext.LoadMask(win.body);
			loadMask.show();
			Ext.Ajax.request({
				url: '{{ component.params.entity_items_url }}'
				,params: {
					'entity_name': entityId
				}
				,success: function(response, opt){
					loadMask.hide();

					var nodes = Ext.decode(response.responseText);
					
					// Заполняется грид на этой же вкладке - выбранные сущности
					var EntityRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
					    {name: 'entityName', mapping: 'entityName'}
					]);
					
					
					var newEntityRecord = new EntityRecord(
					    {entityName: entityName},
					    entityId 
					);
		        	selectedStore.add(newEntityRecord);

		        	//Заполняется дерево на вкладке "Поля"
		        	
		        	//Заполняется дерево на вкладке "Группировка"
		        	
		        	//Заполняется дерево на вкладке "Условия" 
					
				}
				,failure: function(){
					loadMask.hide();
            		uiAjaxFailMessage.apply(this, arguments);
				}
			});
        	
        }                
        return true;
    }
});