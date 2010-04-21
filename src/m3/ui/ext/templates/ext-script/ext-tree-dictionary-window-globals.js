// В данном контексте доступна переменная win, поэтому окно можно не получать конструкцией типа Ext.getCmp('bla-bla');
var ajax = Ext.Ajax;

/*========================================= Работает с гридом ============================================*/
/**
 * Стандартный рендеринг окна c добавлением обработчика. 
 */
function renderWindowGrid(response, opts){
	win = m3_eval(response.responseText);
	if (win!=undefined){
		win.on('refresh_store',function(event, target){
			refreshGridStore();
		});
	};
};

/**
 *  Создание нового значения в справочнике по форме ExtDictionary
 */
function newValueGrid() {
	var tree = Ext.getCmp('{{ component.tree.client_id}}');
	if (!isTreeSelected(tree, 'Новый', 'Выберите элемент в дереве!') ) {
		return;
	};
	
	ajax.request({
		url: "{{ component.url_new_grid }}"
		,success: renderWindowGrid
		,params: {
			'id': tree.getSelectionModel().getSelectedNode().id
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Редактирование значения в справочнике по форме ExtDictionary
 */
function editValueGrid(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!isGridSelected(grid, 'Редактирование', 'Элемент не выбран') ) {
		return;
	};
	
	ajax.request({
		url: "{{ component.url_edit_grid }}"
		,params: {
			'id': grid.getSelectionModel().getSelected().id
		}
		,success: renderWindowGrid
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Удаление значения в справочнике по форме ExtDictionary
 */
function deleteValueGrid(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!isGridSelected(grid, 'Удаление', 'Элемент не выбран') ) {
		return;
	};
	
	Ext.Msg.show({
	   title:'Подтверждение',
	   msg: 'Вы действительно хотите удалить элемент?',
	   buttons: Ext.Msg.YESNO,
	   icon: Ext.MessageBox.QUESTION,
	   fn:function(btn,text,opt){ 
	    	if (btn == 'yes') {
	    		ajax.request({
					url: "{{ component.url_delete_grid }}"
					,params: {
						'id': grid.getSelectionModel().getSelected().id
					}
					,success: renderWindowGrid
					,failure: function(response, opts){
					   Ext.Msg.alert('','failed');
					}
				});
	    	};
	   } 
	});
};

/**
 * Выбор значения в справочнике по форме ExtDictionary
 */
function selectValueGrid(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!isGridSelected(grid, 'Выбор элемента', 'Элемент не выбран') ) {
		return;
	};
	
	id = grid.getSelectionModel().getSelected().id
	displayText = grid.getSelectionModel().getSelected().get("{{ component.column_name_on_select }}")
	
	if (id!=undefined && displayText!=undefined){
		win.fireEvent('select_value', id, displayText);
	};
	win.close();
};

/**
 * Перезагружает хранилище данных
 */
function refreshGridStore(){
	var search_field_grid = Ext.getCmp("{{ component.search_text_grid.client_id }}");
	if (search_field_grid)
		search_field_grid.search();
};

/*========================================== Работаем с деревом ===========================================*/
/**
 * Рендерит дочерние окна и навешивает обработчики
 * @param {String} response
 * @param {Object} opts
 */
function renderWindowTree(response, opts){
	win = m3_eval(response.responseText);
	if (win!=undefined){
		win.on('refresh_store',function(event, target){
			refreshTreeLoader();
		});
	};
};

/**
 *  Создание нового значения в корне дерева
 */
function newValueTreeRoot() {
	ajax.request({
		url: "{{ component.url_new_tree }}"
		,success: renderWindowTree
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 *  Создание нового дочернего значения
 */
function newValueTreeChild() {
	var tree = Ext.getCmp('{{ component.tree.client_id}}');
	if (!isTreeSelected(tree, 'Новый', 'Элемент не выбран') ) {
		return;
	};
	
	ajax.request({
		url: "{{ component.url_new_tree }}"
		,success: renderWindowTree
		,params: {
			'id': tree.getSelectionModel().getSelectedNode().id
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Редактирование значения в дереве
 */
function editValueTree(){
	var tree = Ext.getCmp('{{ component.tree.client_id}}');
	if (!isTreeSelected(tree, 'Редактирование', 'Элемент не выбран') ) {
		return;
	};
	
	ajax.request({
		url: "{{ component.url_edit_tree }}"
		,params: {
			'id': tree.getSelectionModel().getSelectedNode().id
		}
		,success: renderWindowTree
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Удаление значения в дереве
 */
function deleteValueTree(){
	var tree = Ext.getCmp('{{ component.tree.client_id}}');
	if (!isTreeSelected(tree, 'Удаление', 'Элемент не выбран') ) {
		return;
	};
	
	Ext.Msg.show({
	   title:'Подтверждение',
	   msg: 'Вы действительно хотите удалить элемент?',
	   buttons: Ext.Msg.YESNO,
	   icon: Ext.MessageBox.QUESTION,
	   fn:function(btn,text,opt){ 
	    	if (btn == 'yes') {
    			ajax.request({
					url: "{{ component.url_delete_tree }}"
					,params: {
						'id': tree.getSelectionModel().getSelectedNode().id
					}
					,success: renderWindowTree
					,failure: function(response, opts){
					   Ext.Msg.alert('','failed');
					}
				});
	    	};
	   } 
	});
	

};

/**
 * 
 * Перезагружает хранилище данных для дерева
 */
function refreshTreeLoader(){
	var search_field_tree = Ext.getCmp("{{ component.search_text_tree.client_id }}");
	if (search_field_tree)
		search_field_tree.search();
};

/*
 * Обработчик выделение узла в дереве
 */
function onClickNode(node, e){
	var search_field_grid = Ext.getCmp("{{ component.search_text_grid.client_id }}");
	if (search_field_grid) {
		search_field_grid.nodeId = node.id;
		search_field_grid.search();
	}
}
/**
 * 
 * @param {Object} tree Ссылка на дерево
 * @param {String} message Сообщение (Новый, Редактирование, Удаление)
 * @return {Bool} Да, если элемент выделен 
 */
function isTreeSelected(tree, title, message){
	res = true;
	if (tree.getSelectionModel().isSelected()) {
		Ext.Msg.show({
		   title: title,
		   msg: message,
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
		res = false;
	};
	return res;
};

/**
 * 
 * @param {Object} tree Ссылка на дерево
 * @param {String} message Сообщение (Новый, Редактирование, Удаление)
 * @return {Bool} Да, если элемент выделен 
 */
function isGridSelected(grid, title, message){
	res = true;
	if (!grid.getSelectionModel().hasSelection() ) {
		Ext.Msg.show({
		   title: title,
		   msg: message,
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
		res = false;
	};
	return res;
};