
var hdnID = Ext.getCmp('{{ component.hdn_id.client_id }}');
var edtQueryName = Ext.getCmp('{{ component.str_name.client_id }}');

var treeEntities = Ext.getCmp('{{ component.tree_entities.client_id }}');
var grdSelectedEntities = Ext.getCmp('{{ component.grd_selected_entities.client_id }}');
var grdLinks = Ext.getCmp('{{ component.grd_links.client_id }}');

var treeAllFields = Ext.getCmp('{{ component.tree_all_fields.client_id }}');
var grdSelectedFields = Ext.getCmp('{{ component.grd_selected_fields.client_id }}'); 
var distinctChk = Ext.getCmp('{{ component.chk_distinct.client_id }}');
var limitChk = Ext.getCmp('{{ component.chk_limit.client_id }}');
var limitCount = Ext.getCmp('{{ component.nmbr_limit_count.client_id }}');

var treeGroupsFields = Ext.getCmp('{{ component.tree_groups_fields.client_id }}');
var grdGroupFields = Ext.getCmp('{{ component.grd_group_fields.client_id }}');
var grdGroupAggrFields = Ext.getCmp('{{ component.grd_gruop_aggr_fields.client_id }}');

var treeConditionsFields = Ext.getCmp('{{ component.tree_conditions_fields.client_id }}');
var grdConditionsFields = Ext.getCmp('{{ component.grd_conditions.client_id }}');


////////////////////////////////////////////////////////////////////////////////
/**
 * Класс модели для сущностей и сразу же создание экземпляра 
 */
var entityModel = new function(){
	
	var _entities = [];
	var trees = [treeAllFields, treeGroupsFields, treeConditionsFields];

	return {
		/*
		 * Добавляет сущность
		 */
		add: function(entities){

			var url = '{{ component.params.entity_items_url }}';
			assert(url, 'Url for child window is not define');
	
			var loadMask = new Ext.LoadMask(win.body);
			loadMask.show();
			Ext.Ajax.request({
				url: url
				,params: {
					'entities': Ext.encode(entities)
				}
				,success: function(response, opt){
					loadMask.hide();
					
					var nodes = Ext.decode(response.responseText);
	
					var node, rootNode;
														
					for (var i=0; i<trees.length; i++){
						
						rootNode = trees[i].getRootNode();
						rootNode.loaded = true;
						
						for (var j=0; j<nodes.length; j++) {		
							
							node = new Ext.tree.TreeNode(nodes[j]);
						   
						    rootNode.getOwnerTree().getLoader().doPreload(node);                
						    if(node){
						        rootNode.appendChild(node);
						    }

					        if (i==0){ // Заполняем ноды при заполнении одного дерева
					        	_entities.push( nodes[j] );
					        }
						}					
					}										
				}
				,failure: function(){
					loadMask.hide();
	        		uiAjaxFailMessage.apply(this, arguments);
				}
			});						
		},
		
		/*
		 * Удаляет сущность
		 */
		remove: function (entities){		
			var removeInGrid = function(grid, entityField, entityName){
				var store = grid.getStore();
				var records = store.query(entityField, entityName).getRange();
				if (records){
					store.remove(records);	
				}
			}	
			
			// Нужно удалить выбранный массив id сущностей из всех деревьев
			// Пробежаться по всем полям и удалить все поля, которые входят в удаляемую сущность
			var grids = [grdSelectedFields, grdGroupFields, grdGroupAggrFields, grdConditionsFields];						
						
			
			var rootNode;			
			for (var j=0; j<entities.length; j++) {
				
				// Удаление всех имеющихся узлов 
				for (var i=0; i<trees.length; i++){
					rootNode = trees[i].getRootNode();
					
					var node = rootNode.findChild('id', entities[j]);
					node.remove();					
				}
			
				// Удаление записей в гридах, кроме грида связей
				for (var k=0; k<grids.length; k++){
					removeInGrid(grids[k], 'id', entities[j]);	
				}
				
				removeInGrid(grdLinks, 'entityFirst', entities[j]);
				removeInGrid(grdLinks, 'entitySecond', entities[j]);
			}
		},
		
		/*
		 * Возвращает имеющиеся сущности
		 */
		getEntities:function (){			
			return _entities;
		}	
	}
}

////////////////////////////////////////////////////////////////////////////////
// Общие функции
/*
 * Удаление поля в произвольном гриде
 */
function deleteField(grid){	
	var sm =  grid.getSelectionModel();
	if (sm instanceof Ext.grid.RowSelectionModel){
		 grid.getStore().remove( sm.getSelections() );
	} else if (sm instanceof Ext.grid.CellSelectionModel) {
		var rec = sm.getSelectedCell();
		if (rec) {
			var currentRecord = grid.getStore().getAt(rec[0]);
			grid.getStore().remove(currentRecord);
		}
	}
}

/**
 * Добавление поля в произвольный грид c полями: 
 * 	dataIndex='fieldName' 
 * 	dataIndex='entityName'
 */
function addField(grid, node){
	var Record = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
	    {name: 'fieldName', mapping: 'fieldName'},
	    {name: 'entityName', mapping: 'entityName'},
	]);

	var fieldName = node.attributes['verbose_field'];
	var entityName = node.attributes['entity_name'];
	var fieldID = node.attributes['id_field'];
	
	var newRecord = new Record(
	    {'fieldName': fieldName,
	    'entityName': entityName},
	    String.format('{0}-{1}', entityName, fieldID) 
	);
	grid.getStore().add(newRecord);
}

/**
 * D&d из дерева сущностей в произвольный грид. Общий обработчик.
 */
function onAfterRenderGrid(grid){
	var fieldsDropTargetEl = grid.getView().scroller.dom;
	var selectFieldsDropTarget = new Ext.dd.DropTarget(fieldsDropTargetEl, {
	    ddGroup    : 'TreeDD',
	    notifyDrop : function(ddSource, e, data){  
			addField(grid, data.node);	 			 		
	    }
	});	
}

/**
 * Обработчик произвольной кнопки добавить
 */
function addFieldBtn(tree, grid){
	var node = tree.getSelectionModel().getSelectedNode();	
	if (node) {
		addField(grid, node);		
	}
}

////////////////////////////////////////////////////////////////////////////////
// Вкладка - Таблица и связи

/*
 * Обновление сущностей
 */
function refreshEntities(){    
	var rootNode = treeEntities.getRootNode();
	treeEntities.getLoader().load(rootNode);
	rootNode.expand();
}

/*
 * Добавление сущности в проект
 */
function onAddEntity(){
	var node = treeEntities.getSelectionModel().getSelectedNode();	
	if (node) {		
		addEntity(node);		
	}
}

/*
 * Хендлер на кнопку "Добавить сущность"
 */
function addEntity(node){
    var selectedStore = grdSelectedEntities.getStore(),
		entityId = node.id,
		entityName = node.attributes['schemes'];
            
    
    var record = selectedStore.getById(entityId);        
    if (!record && entityId && entityName){

		// Заполняется грид на этой же вкладке - выбранные сущности
		var EntityRecord = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
		    {name: 'entityName', mapping: 'entityName'},					    
		]);
		
		var newEntityRecord = new EntityRecord(
		    {'entityName': entityName},					    
		    entityId 
		);
    	selectedStore.add(newEntityRecord);
    	
    	entityModel.add([entityId]);    	
    }   
}

/**
 * D&d из дерева сущностей в выбранные сущности
 */
var selectEntityDropTargetEl = grdSelectedEntities.getView().scroller.dom;
var selectEntityDropTarget = new Ext.dd.DropTarget(selectEntityDropTargetEl, {
    ddGroup    : 'TreeDD',
    notifyDrop : function(ddSource, e, data){                    
		addEntity(data.node);             
        return true;
    }
});

/**
 * Удаление сущностей
 */
function deleteEntity(){	
	var sel = grdSelectedEntities.getSelectionModel().getSelections();
	var massEntities = [];
	for (var i=0; i<sel.length; i++){
		massEntities.push(sel[i].id);
	}
	entityModel.remove(massEntities);
	grdSelectedEntities.getStore().remove(sel);
}

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
            
            childWin.fireEvent('fillNodes', entityModel.getEntities() );
            
            // Подпись на нажатие "Выбор" и обработка результатов запроса
            childWin.on('selectLinks', function(resObj){

				var LinkRecord = Ext.data.Record.create([
				    {name: 'entityFirst', mapping: 'entityFirst'},
				    {name: 'entityFirstField', mapping: 'entityFirstField'},
				    {name: 'outerFirst', mapping: 'outerFirst'},
				    {name: 'entitySecond', mapping: 'entitySecond'},
				    {name: 'entitySecondField', mapping: 'entitySecondField'},
				    {name: 'outerSecond', mapping: 'outerSecond'},
				    {name: 'value', mapping: 'value'}
				]);
				
				
				var newLinkRecord = new LinkRecord(
				    {
				    	entityFirst: resObj['firstEntity']['entityName'],
				    	entityFirstField: resObj['firstEntity']['fieldName'],
				    	outerFirst: resObj['firstEntity']['outer'],
				    	entitySecond: resObj['secondEntity']['entityName'],
				    	entitySecondField: resObj['secondEntity']['fieldName'],
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
	deleteField(grdLinks);       
}

/*Закрытие окна*/
function winClose(){
    win.close();
}

////////////////////////////////////////////////////////////////////////////////
// Вкладка - Поля


grdSelectedFields.on('afterrender', function(){
	onAfterRenderGrid(grdSelectedFields);
})

function addSelectField(){
	addFieldBtn(treeAllFields, grdSelectedFields);
}

function deleteSelectField(){
	deleteField(grdSelectedFields);
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



////////////////////////////////////////////////////////////////////////////////
// Вкладка - Группировка

grdGroupFields.on('afterrender', function(){
	onAfterRenderGrid(grdGroupFields);
});

grdGroupAggrFields.on('afterrender', function(){
	onAfterRenderGrid(grdGroupAggrFields);
});

function addGroupField(){
	addFieldBtn(treeGroupsFields, grdGroupFields);
}

function addGroupAggrField(){
	addFieldBtn(treeGroupsFields, grdGroupAggrFields);
}

function deleteGroupField(){	
	deleteField(grdGroupFields);	
}

function deleteGroupAggrField(){	
	deleteField(grdGroupAggrFields);	
}


////////////////////////////////////////////////////////////////////////////////
// Вкладка - Условия

grdConditionsFields.on('afterrender', function(){

	var fieldsDropTargetEl = grdConditionsFields.getView().scroller.dom;
	var selectFieldsDropTarget = new Ext.dd.DropTarget(fieldsDropTargetEl, {
	    ddGroup    : 'TreeDD',
	    notifyDrop : function(ddSource, e, data){  
 			openConditionWindow(data.node);
	    }
	});	
});

/**
 * Открывает окно для добавления нового условия
 */
function openConditionWindow(node){
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    
    Ext.Ajax.request({
        url: '{{component.params.condition_url}}'
        ,params: win.actionContextJson || {}
        ,success: function(response){
            loadMask.hide();
            var childWin = smart_eval(response.responseText);
            childWin.fireEvent('loadData', {
            	'field': node.attributes['verbose_field']
            });
            childWin.on('selectData', function(obj){

         		var Record = Ext.data.Record.create([ // creates a subclass of Ext.data.Record
				    {name: 'fieldName', mapping: 'fieldName'},
				    {name: 'entityName', mapping: 'entityName'},
				    {name: 'condition', mapping: 'condition'},
				    {name: 'parameter', mapping: 'parameter'},
				    {name: 'expression', mapping: 'expression'},
				]);
			
				var fieldName = node.attributes['verbose_field'];
				var entityName = node.attributes['entity_name'];
				var fieldID = node.attributes['id_field'];
				
				var condition = obj['condition'];
				var parameter = obj['parameter'];
				
				var newRecord = new Record(
				    {'fieldName': fieldName,
				    'entityName': entityName,
				    'condition':condition,
				    'parameter':parameter,
				    'expression': String.format('{0} {1} {2}', fieldName, condition, parameter)
				   },
				   String.format('{0}-{1}', entityName, fieldID) 				    
				);
				grdConditionsFields.getStore().add(newRecord);
				
            });		            
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});	
	
}

function deleteCondition(){	
	deleteField(grdConditionsFields);	
}

/**
 * Обработчик произвольной кнопки добавить
 */
function addCondition(){
	var node = treeConditionsFields.getSelectionModel().getSelectedNode();	
	if (node) {
		openConditionWindow(node);		
	}
}

// Отправляет запрос на сервер и получает sql-запрос в качестве ответа
function showQueryText(){
	
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    
	Ext.Ajax.request({
		url: '{{component.params.query_text_url }}'
		,params: {
			'objects': Ext.encode( buildParams() )
		}
		,success: function(response){
			loadMask.hide();
			console.log('sql');
            smart_eval(response.responseText);
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});
}

// Сохраняет запрос
function saveQuery(){
	var queryName = edtQueryName.getValue();
	if (!queryName) {
		Ext.Msg.show({
		   title:'Внимание',
		   msg: 'Не введено название запроса',
		   buttons: Ext.Msg.OK,
		   animEl: 'elId',
		   icon: Ext.MessageBox.WARNING
		});
		
		return;
	}
	
	// Получение имени запроса	
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    
	Ext.Ajax.request({
		url: '{{component.params.save_query_url }}'
		,params: {
			'objects': Ext.encode( buildParams() )
			,'query_name': queryName 
			,'id': hdnID.getValue()
		}
		,success: function(){
			loadMask.hide();
			win.fireEvent('closed_ok');
			win.close();
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});		
}

// Билдит параметры, для показа запроса и для сохранения запроса
function buildParams(){
	function getElements(grid, exclusionFields){
		exclusionFields = exclusionFields || [];
		var mass = [];
		var range = grid.getStore().getRange();
		for (var i=0; i<range.length; i++){
			mass.push(range[i].data);
			
			mass[mass.length-1]['id'] = range[i].id;
			
			for (var j=0; j<exclusionFields.length; j++){
				delete mass[mass.length-1][exclusionFields[j]];				
			}
		}
		return mass;
	}
	
	// Сущности в запросе
	var entities = getElements(grdSelectedEntities);
	
	// Связи в запросе
	var relations = getElements(grdLinks);
			
	// Поля в выборке
	var selectedFields = getElements(grdSelectedFields);	
	
	// Группируемые и агригируемые поля
	var groupFields = getElements(grdGroupFields);	
	
	var groupAggrFields = getElements(grdGroupAggrFields);	
	
	// Условия
	var condFields = getElements(grdConditionsFields);	

	var limit;
	if (limitChk.checked) {
		limit = limitCount.getValue();
	}

	return {
		'entities': entities,
		'relations': relations, 
		'selected_fields': selectedFields,
		'group': {
			'group_fields': groupFields,
			'group_aggr_fields': groupAggrFields
		},
		'cond_fields': condFields,
		'distinct': distinctChk.checked,
		'limit': limit || -1		
	}
}


/*
 * Если запрос открыт на редактирование, нужно из имеющихся сущностей 
 * заполнить деревья полей
 */
(function (){
	var mass = [],
		range = grdSelectedEntities.getStore().getRange();
	for (var i=0; i<range.length; i++){
		mass.push(range[i].id);
	}
	
	if (mass) {
		entityModel.add(mass);
	};
})()


// TODO: Сделать модель, которая будет определять добавление и удаление
// полей сущности в деревья на вкладках "Поля", "Группировка", "Условия"