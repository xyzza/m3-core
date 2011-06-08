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


			// var loaderAllFields = treeAllFields.getLoader();
			// loaderAllFields.url = url;
			// loaderAllFields.baseParams = {'entity_name': entityId};
			// loaderAllFields.load( treeAllFields.getRootNode() );

			var loadMask = new Ext.LoadMask(win.body);
			loadMask.show();
			Ext.Ajax.request({
				url: '{{ component.params.entity_items_url }}'
				,params: {
					'entity_name': entityId
				}
				,success: function(response, opt){
					loadMask.hide();
					
					// Заполняется грид на этой же вкладке - выбранные сущности
					var EntityRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
					    {name: 'entityName', mapping: 'entityName'}
					]);
					
					
					var newEntityRecord = new EntityRecord(
					    {entityName: entityName},
					    entityId 
					);
		        	selectedStore.add(newEntityRecord);

					var root_node;
					// Алгоритм заполнения деревьев всеми полями
					var massOfTreeFields = [treeAllFields, treeGroupsFields, treeConditionsFields];
					for (var i=0; i<massOfTreeFields.length;i++){

						root_node = massOfTreeFields[i].getRootNode();
						
				        processResponse(response,  root_node);
				        root_node.loaded = true;
					}
					
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

/**
 * Загружает узел дерева
 * Взято из исходников TreeLoader и немного изменено
 */
function processResponse(response, node){
    var json = response.responseText;    
    var o = response.responseData || Ext.decode(json);
    node.beginUpdate();
    for(var i = 0, len = o.length; i < len; i++){
        var n = new Ext.tree.TreeNode(o[i]);
        
        node.getOwnerTree().getLoader().doPreload(n);        
        if(n){
            node.appendChild(n);
        }
    }
    node.endUpdate();
}

