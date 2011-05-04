// В данном контексте доступна переменная win, поэтому окно можно не получать конструкцией типа Ext.getCmp('bla-bla');
var ajax = Ext.Ajax;

{% if component.grid %}
	/*========================================= Работает с гридом ============================================*/
    win.addEvents(
       /**
        * Событие до создания новой строки в гриде
        * @param grid - дерево Ext.grid.GridPanel
        * @param params - словарь параметров, передаваемых Ajax запросу
        */
       'beforenewrow',
	   /**
        * Событие до редактирования строки в гриде
        * @param grid - дерево Ext.grid.GridPanel
        * @param params - словарь параметров, передаваемых Ajax запросу
        */
	   'beforeeditrow'
    );
	
	/**
	 * Стандартный рендеринг окна c добавлением обработчика. 
	 */
	function renderWindowGrid(response, opts){	    	    
		var win = smart_eval(response.responseText);
		if (win!=undefined){
			
			win.on('refresh_store',function(event, target){ // deprecated
				refreshGridStore();
			});
			win.on('closed_ok',function(event, target){
				refreshGridStore();
			});
		};
	}
	
	/**
	 *  Создание нового значения в справочнике по форме ExtDictionary
	 */
	function newValueGrid() {
        var grid = Ext.getCmp('{{ component.grid.client_id}}');
		var params = Ext.applyIf({'id': ''},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %});
		{% if component.tree %}
			var tree = Ext.getCmp('{{ component.tree.client_id}}');
			if (!isTreeSelected(tree, 'Новый', 'Выберите элемент в дереве!') ) {
				return;
			};
			params = Ext.applyIf({ '{{ component.contextTreeIdName }}': tree.getSelectionModel().getSelectedNode().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %});
		{%endif%}

		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
		
		if (!win.fireEvent('beforenewrow', grid, params))
		  return;
        
        var mask = new Ext.LoadMask(win.body);			
        mask.show();
		ajax.request({
			url: "{{ component.url_new_grid }}"
			,success: function(){			    
			    renderWindowGrid.apply(this, arguments);
			    mask.hide();
			}
			,params: params
			,failure: function(){ 
			    uiAjaxFailMessage.apply(win, arguments);
			    mask.hide();
			}
		});
	}
	
	/**
	 * Редактирование значения в справочнике по форме ExtDictionary
	 */
	function editValueGrid(){
		var grid = Ext.getCmp('{{ component.grid.client_id}}');
		if (!isGridSelected(grid, 'Редактирование', 'Элемент не выбран') ) {
			return;
		};

		var params = Ext.applyIf({ 'id': grid.getSelectionModel().getSelected().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %});
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
        
        if (!win.fireEvent('beforeeditrow', grid, params))
		  return;
		
		var mask = new Ext.LoadMask(win.body);   
		mask.show();
		ajax.request({
			url: "{{ component.url_edit_grid }}"
			,params: params
			,success: function(){                
                renderWindowGrid.apply(this, arguments);
                mask.hide();
            }            
            ,failure: function(){ 
                uiAjaxFailMessage.apply(win, arguments);
                mask.hide();
            }
		});
	}
	
	/**
	 * Удаление значения в справочнике по форме ExtDictionary
	 */
	function deleteValueGrid(){
		var grid = Ext.getCmp('{{ component.grid.client_id}}');
		if (!isGridSelected(grid, 'Удаление', 'Элемент не выбран') ) {
			return;
		};
		
		var selectedId = new Array();
		var selRecords = grid.getSelectionModel().getSelections();
		for (var i=0; i < selRecords.length; i++){
			selectedId[i] = selRecords[i].id;
		};
		
		var message;
		if (selectedId.length > 1)
			message = 'Вы действительно хотите удалить элементы?'
		else
			message = 'Вы действительно хотите удалить элемент?'
		
		var params = {'id': selectedId.join(',')};
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
				
		Ext.Msg.show({
		   title:'Подтверждение',
		   msg: message,
		   buttons: Ext.Msg.YESNO,
		   icon: Ext.MessageBox.QUESTION,
		   fn:function(btn,text,opt){ 
		    	if (btn == 'yes') {
		    	    
		    	    var mask = new Ext.LoadMask(win.body);
                    mask.show();
        
		    		ajax.request({
						url: "{{ component.url_delete_grid }}"
						,params: params
						,success: function(response, opts){
							renderWindowGrid(response, opts);
							mask.hide();
							// Удаляем из стора только если пришел success=true
							if (uiShowErrorMessage(response))
								grid.getStore().remove(selRecords);
						}
						,failure: function(){ 
                            uiAjaxFailMessage.apply(win, arguments);
                            mask.hide();
                        }
					});
		    	};
		   } 
		});
	}
	
	
	/**
	 * Перезагружает хранилище данных
	 */
	function refreshGridStore(){
		var bbar = Ext.getCmp("{{ component.grid.client_id }}").getBottomToolbar();
		if (bbar && bbar.isXType('paging')) {
			bbar.doRefresh();
		} else {
			var search_field = Ext.getCmp("{{ component.search_text_grid.client_id }}");
			if (search_field) {
				search_field.search();
			}
		}
	}
	
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
	}
	
	
{%endif%}
	
{% if component.tree %}
	/*========================================== Работаем с деревом ===========================================*/
	win.addEvents(
	   /**
	    * Событие до создания нового элемента дерева
	    * @param tree - дерево Ext.tree.TreePanel
	    * @param params - словарь параметров, передаваемых Ajax запросу
	    */
	   'beforenewnode',
	   /**
        * Событие до редактирования элемента дерева
        * @param tree - дерево Ext.tree.TreePanel
        * @param node - узел Ext.data.Node
        * @param params - словарь параметров, передаваемых Ajax запросу
        */
	   'beforeeditnode'
	);
	
	/**
	 * Рендерит дочерние окна и навешивает обработчики
	 * @param {String} response
	 * @param {Object} opts
	 */
	function renderWindowTree(response, opts, parentNode){
		var child_win = smart_eval(response.responseText);
		if (child_win != undefined){
			child_win.on('refresh_store', function(event, target){
				// Если задан родительский узел, то перезаполнянм его дочерние
				// элементы и раскрываем его.
				if (parentNode) {
					var params = Ext.applyIf({ node: parentNode.id }, {% if component.action_context %}{{ component.action_context.json|safe }}{% else %}{}{% endif %});
					// добавим глобальный контекст окна
					params = Ext.applyIf(params, win.actionContextJson || {});

					var tree = Ext.getCmp('{{ component.tree.client_id }}');			
					ajax.request({
						url: tree.getLoader().dataUrl,
						success: function (response, opts) {
								var nodes = Ext.util.JSON.decode(response.responseText);
								var isExpanded = !parentNode.childNodes.length || parentNode.isExpanded();
								parentNode.removeAll();
								parentNode.appendChild(nodes);
								if (isExpanded)
									parentNode.expand();
						},
						params: params,
						failure: uiAjaxFailMessage
					});
				}
				else {
					refreshTreeLoader();
				}
			});
			child_win.on('closed_ok', function(event, target){
		        // Если задан родительский узел, то перезаполнянм его дочерние
		        // элементы и раскрываем его.
		        if (parentNode) {
		        	var params = Ext.applyIf({ node: parentNode.id }, {% if component.action_context %}{{ component.action_context.json|safe }}{% else %}{}{% endif %});
					// добавим глобальный контекст окна
					params = Ext.applyIf(params, win.actionContextJson || {});
		          var tree = Ext.getCmp('{{ component.tree.client_id }}');
		          ajax.request({
		            url: tree.getLoader().dataUrl,
		            success: function (response, opts) {
		                var nodes = Ext.util.JSON.decode(response.responseText);
		                var isExpanded = !parentNode.childNodes.length || parentNode.isExpanded();
		                parentNode.removeAll();
		                parentNode.appendChild(nodes);
		                if (isExpanded)
		                  parentNode.expand();
		            },
		            params: params,
		            failure: uiAjaxFailMessage
		          });
		        }
		        else {
		          refreshTreeLoader();
		        }
			});
		};
	}
	
	/**
	 *  Создание нового значения в корне дерева
	 */
	function newValueTreeRoot() {
	    var tree = Ext.getCmp('{{ component.tree.client_id}}');
	    var params = Ext.applyIf({'{{ component.contextTreeIdName }}': ''},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
		
		if (!win.fireEvent('beforenewnode', tree, params))
            return;
		
	    var mask = new Ext.LoadMask(win.body);
	    mask.show();
		ajax.request({
			url: "{{ component.url_new_tree }}"
			,success: function(response, opts) {
				renderWindowTree(response, opts);
				mask.hide();
			}
			,params: params
			,failure: function(){ 
                uiAjaxFailMessage.apply(win, arguments);
                mask.hide();
            }
		});
	}
	
	/**
	 *  Создание нового дочернего значения
	 */
	function newValueTreeChild() {
		var tree = Ext.getCmp('{{ component.tree.client_id}}');
		if (!isTreeSelected(tree, 'Новый', 'Элемент не выбран') ) {
			return;
		};
		var node = tree.getSelectionModel().getSelectedNode();
		var params = Ext.applyIf({ '{{ component.contextTreeIdName }}': node.id },{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
		
		if (!win.fireEvent('beforenewnode', tree, params))
            return;
		
		var mask = new Ext.LoadMask(win.body);
		mask.show();
		ajax.request({
			url: "{{ component.url_new_tree }}"
			,success: function (response, opts) {
				renderWindowTree(response, opts, node);
				mask.hide();
			}
			,params: params
            ,failure: function(){ 
                uiAjaxFailMessage.apply(win, arguments);
                mask.hide();
            }
		});
	}
	
	/**
	 * Редактирование значения в дереве
	 */
	function editValueTree(){
		var tree = Ext.getCmp('{{ component.tree.client_id}}');
		if (!isTreeSelected(tree, 'Редактирование', 'Элемент не выбран') ) {
        	return;
		};
		var node = tree.getSelectionModel().getSelectedNode();
		var params = Ext.applyIf({ '{{ component.contextTreeIdName }}': node.id}, {% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
		
        if (!win.fireEvent('beforeeditnode', tree, node, params))
            return;
		
		ajax.request({
			url: "{{ component.url_edit_tree }}"
			,params: params 
			,success: function (response, opts) {
				renderWindowTree(response, opts, node.parentNode);
			}
			,failure: uiAjaxFailMessage
		});
	}
	
	/**
	 * Удаление значения в дереве
	 */
	function deleteValueTree(){
		var tree = Ext.getCmp('{{ component.tree.client_id}}');
		if (!isTreeSelected(tree, 'Удаление', 'Элемент не выбран') ) {
			return;
		};
		var params = Ext.applyIf({ '{{ component.contextTreeIdName }}': tree.getSelectionModel().getSelectedNode().id},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
		// добавим глобальный контекст окна
		params = Ext.applyIf(params, win.actionContextJson || {});
		
		Ext.Msg.show({
		   title:'Подтверждение',
		   msg: 'Вы действительно хотите удалить элемент?',
		   buttons: Ext.Msg.YESNO,
		   icon: Ext.MessageBox.QUESTION,
		   fn:function(btn,text,opt){ 
		    	if (btn == 'yes') {
	    			ajax.request({
						url: "{{ component.url_delete_tree }}"
						,params: params
						,success: function(response, opts) {
							// Удаляем из стора только если пришел success=true
							renderWindowTree(response, opts);
							if (uiShowErrorMessage(response)) {
								tree.getSelectionModel().getSelectedNode().remove();
							}
						}
						,failure: uiAjaxFailMessage
					});
		    	};
		   } 
		});
	}
	
	/**
	 * Перезагружает хранилище данных для дерева
	 */
	function refreshTreeLoader(){
		var search_field_tree = Ext.getCmp("{{ component.search_text_tree.client_id }}");
		if (search_field_tree)
			search_field_tree.search();
			//очищаем грид
			{% if component.grid %}
				var grid_store = Ext.getCmp("{{ component.grid.client_id }}").getStore();
				grid_store.removeAll();
			{% endif %}
	}
	
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
		var res = true;
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
	}
	
	/**
	 * Функция-обработчик d&d
	 * @param {Object} dropObj
	 */
	function onBeforeDrop(dropObj){
		if (dropObj.source.grid){
			var grid = dropObj.source.grid;
			var selectedId = new Array();
			var selRecords = grid.getSelectionModel().getSelections();
			for (var i=0; i < selRecords.length; i++){
				selectedId[i] = selRecords[i].id;
			};
			
			ajax.request({
				url: "{{ component.url_drag_grid }}"
				,params: {
					'id': selectedId.join(','),
					'dest_id': dropObj.target.id
				}
				,success: function(){ 
					grid.getStore().remove(selRecords);
				}
				,failure: function(response, opts){
					dropObj.cancel = false;
				    uiAjaxFailMessage(response, opts);
				}
			});
		} else if (dropObj.source.tree){
			var selModel = dropObj.source.tree.getSelectionModel();
			ajax.request({
				url: "{{ component.url_drag_tree }}"
				,params: {
					'id': selModel.getSelectedNode().id,
					'dest_id': dropObj.target.id
				}
				,success: Ext.emptyFn
				,failure: function(response, opts){
					dropObj.cancel = false;
				    uiAjaxFailMessage(response, opts);
				}
			});
		}	
	}
{%endif%}

{% if component.mode %}
	/**
	 * Выбор значения в справочнике по форме ExtDictionary
	 */
	function selectValue(){
		var id, displayText;
		{%if component.grid %}
			var grid = Ext.getCmp('{{ component.grid.client_id}}');
			if (!isGridSelected(grid, 'Выбор элемента', 'Выберите элемент из списка') ) {
				return;
			}
			
			id = grid.getSelectionModel().getSelected().id;
			displayText = grid.getSelectionModel().getSelected().get("{{ component.column_name_on_select }}");			
		{% else %}
			var tree = Ext.getCmp('{{ component.tree.client_id}}');
			if (!isTreeSelected(tree, 'Новый', 'Выберите элемент в дереве!') ) {
				return;
			}
			
			id = tree.getSelectionModel().getSelectedNode().id;
			displayText = tree.getSelectionModel().getSelectedNode().attributes.{{ component.column_name_on_select }};
		{% endif %}
		assert(id!=undefined, 'Справочник не определил id объекта. Поле выбора не будет работать');
		assert(displayText!=undefined, 'Справочник не определил displayText объекта. Возможно он не приходит с ajax ответом, в JsonStore нет соответствующего поля, в гриде нет соотв. колонки или неправильно указан column_name_on_select!');
		var win = Ext.getCmp('{{ component.client_id}}');
		win.fireEvent('closed_ok', id, displayText);
		win.close();
	}
{%endif%}

{% block content %}{% endblock %}