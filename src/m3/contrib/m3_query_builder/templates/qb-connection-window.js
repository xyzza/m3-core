

var treeEntitiesFieldsFirst = Ext.getCmp('{{ component.tree_entities_fields_first.client_id }}');
var treeEntitiesFieldsSecond = Ext.getCmp('{{ component.tree_entities_fields_second.client_id }}');

/**
 * Подписка на событие добавления узлов
 */
win.on('fillNodes', function(childNodes){
	var rootNode;
	var massOfTreeFields = [treeEntitiesFieldsFirst, treeEntitiesFieldsSecond];
	for (var i=0; i<massOfTreeFields.length;i++){

		rootNode = massOfTreeFields[i].getRootNode();		
		appendChildNode(rootNode, childNodes);
	}	
});

/**
 * Копирование узлов в узел
 * @param node: Куда будут копироваться узлы
 * @param childNodes: Список узлов, которые будут скопированы
 */
function appendChildNode(node, childNodes){
	var n, childNode, nChild;
	for (var i=0; i<childNodes.length;i++){
		childNode = childNodes[i];
        n = new Ext.tree.TreeNode(childNode);
        
        node.getOwnerTree().getLoader().doPreload(n);  
        
        node.appendChild(n);            
	}
}

/**
 * 
 */
function selectLinks(){
	var firstNode = treeEntitiesFieldsFirst.getSelectionModel().getSelectedNode();
	var secondNode = treeEntitiesFieldsSecond.getSelectionModel().getSelectedNode();

	if (!firstNode ||  !secondNode){
		Ext.Msg.show({
	       title:'Выбор связи'
	       ,msg: 'Не все поля выбраны для связи'
	       ,buttons: Ext.Msg.OK
	       ,icon: Ext.MessageBox.WARNING
	    });
	    return;
	}
	
	var firstChkLink = Ext.getCmp('{{ component.chk_link_first.client_id }}');
	var secondChkLink = Ext.getCmp('{{ component.chk_link_second.client_id }}');
	
	var resObj = {
		'firstEntity': {
			'fieldName': firstNode.attributes['verbose_field']
			,'entityName': firstNode.attributes['entity_name']
			,'outer': firstChkLink.checked
		},
		'secondEntity': {
			'fieldName': secondNode.attributes['verbose_field']
			,'entityName': secondNode.attributes['entity_name']
			,'outer': secondChkLink.checked
		},
	}

	win.fireEvent('selectLinks', resObj);
	win.close();
}
