/**
 * User: kirs
 * Date: 02.06.11
 * Time: 13:49
 */

var treeEntities = Ext.getCmp('{{ component.tree_entities.client_id }}');
var grdSelectedEntities = Ext.getCmp('{{ component.grd_selected_entities.client_id }}');
var grdLinks = Ext.getCmp('{{ component.grd_links.client_id }}');

var treeAllFields = Ext.getCmp('{{ component.tree_all_fields.client_id }}');
var treeGroupsFields = Ext.getCmp('{{ component.tree_groups_fields.client_id }}');
var treeConditionsFields = Ext.getCmp('{{ component.tree_conditions_fields.client_id }}'); 


var grdSelectedFields = Ext.getCmp('{{ component.grd_selected_fields.client_id }}'); 


/*Выбор связи*/
function selectConnection(){
    var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    
    Ext.Ajax.request({
        url: '{{component.params.select_connections_url}}'
        ,params: win.actionContextJson || {}
        ,success: function(response){
            loadMask.hide();
            var childWin = smart_eval(response.responseText);
            childWin.fireEvent('fillNodes', treeAllFields.getRootNode().childNodes );
            
            // Подпись на нажатие "Выбор" и обработка результатов запроса
            childWin.on('selectLinks', function(resObj){

				var LinkRecord = Ext.data.Record.create([
				    {name: 'entityFirst', mapping: 'entityFirst'},
				    {name: 'outerFirst', mapping: 'outerFirst'},
				    {name: 'entitySecond', mapping: 'entitySecond'},
				    {name: 'outerSecond', mapping: 'outerSecond'},
				    {name: 'value', mapping: 'value'}
				]);
				
				
				var newLinkRecord = new LinkRecord(
				    {
				    	entityFirst: resObj['firstEntity']['fieldName'],
				    	outerFirst: resObj['firstEntity']['outer'],
				    	entitySecond: resObj['secondEntity']['fieldName'],
				    	outerSecond: resObj['secondEntity']['outer'],
				    	value: String.format('{0}.{1} = {2}.{3}', 				    	
				    		resObj['firstEntity']['entityName'],
				    		resObj['firstEntity']['fieldName'],
				    		resObj['secondEntity']['entityName'],
				    		resObj['secondEntity']['fieldName']				    					    	
				    	)				    	
				    }
				);
		
	        	grdLinks.getStore().add(newLinkRecord);
            });
        }
        ,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
    });
};

/*Удаление связи*/
function deleteConnection(){    
    grdLinks.getStore().remove( grdLinks.getSelectionModel().getSelections() );
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
					
					// Заполняется грид на этой же вкладке - выбранные сущности
					var EntityRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
					    {name: 'entityName', mapping: 'entityName'}
					]);
					
					
					var newEntityRecord = new EntityRecord(
					    {entityName: entityName},
					    entityId 
					);
		        	selectedStore.add(newEntityRecord);

					var rootNode;
					// Алгоритм заполнения деревьев всеми полями
					var massOfTreeFields = [treeAllFields, treeGroupsFields, treeConditionsFields];
					for (var i=0; i<massOfTreeFields.length; i++){

						rootNode = massOfTreeFields[i].getRootNode();
						
				        processResponse(response,  rootNode);
				        rootNode.loaded = true;
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


/**
 * D&d из дерева сущностей в выбранные сущности. Обработчик.
 */
grdSelectedFields.on('afterrender', function(){
	var selectFieldsDropTargetEl = grdSelectedFields.getView().scroller.dom;
	var selectFieldsDropTarget = new Ext.dd.DropTarget(selectFieldsDropTargetEl, {
	    ddGroup    : 'TreeDD',
	    notifyDrop : function(ddSource, e, data){  
			__addSelectField(data.node);	 			 		
	    }
	});	
})

/**
 * Обработчик кнопки добавить
 */
function addSelectField(){
	var node = treeAllFields.getSelectionModel().getSelectedNode();	
	if (node) {
		__addSelectField(node);
	}
}

/**
 * Непосредственная логика добавления поля
 */
function __addSelectField(node){
	var SelectedRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
	    {name: 'selectedField', mapping: 'selectedField'},
	    {name: 'entity', mapping: 'entity'},
	]);

	var selectedField = node.attributes['fields_entities'];
	var entity = node.attributes['entity_name'];
	
	var newSelectedRecord = new SelectedRecord(
	    {selectedField: selectedField,
	    entity: entity}
	);
	grdSelectedFields.getStore().add(newSelectedRecord);
}

/**
 * Поднимает вверх выбранное поле
 */
function fieldUp(){	
	var rec = grdSelectedFields.getSelectionModel().getSelectedCell();
	if (rec && rec[0] > 0){
		var currentRecord = grdSelectedFields.getStore().getAt(rec[0]);
		
		grdSelectedFields.getStore().remove(currentRecord);		
		grdSelectedFields.getStore().insert(rec[0] - 1, currentRecord);
		
		grdSelectedFields.getSelectionModel().select(rec[0] - 1, rec[1]);
	}	
}

/**
 * Опускает вниз выбранное поле
 */
function fieldDown(){
	var rec = grdSelectedFields.getSelectionModel().getSelectedCell();

	if (rec && rec[0] < grdSelectedFields.getStore().getCount()-1){
		var currentRecord = grdSelectedFields.getStore().getAt(rec[0]);		
		grdSelectedFields.getStore().remove(currentRecord);		
		grdSelectedFields.getStore().insert(rec[0] + 1, currentRecord);
		
		grdSelectedFields.getSelectionModel().select(rec[0] + 1, rec[1]);
	}	
}

/*Удаление поля в гриде выбранных полей*/
function deleteSelectField(){    
	var rec = grdSelectedFields.getSelectionModel().getSelectedCell();
	if (rec) {
		var currentRecord = grdSelectedFields.getStore().getAt(rec[0]);
		 grdSelectedFields.getStore().remove(currentRecord);
	}
}

// TODO: Сделать модель, которая будет определять добавление и удаление
// полей сущности в деревья на вкладках "Поля", "Группировка", "Условия"