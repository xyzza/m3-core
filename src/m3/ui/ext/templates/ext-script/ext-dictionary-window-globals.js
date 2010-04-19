// В данном контексте доступна переменная win, поэтому окно можно не получать конструкцией типа Ext.getCmp('bla-bla');
var ajax = Ext.Ajax;

/**
 * Стандартный рендеринг окна c добавлением обработчика
 */
function renderWindow(response, opts){
	win = m3_eval(response.responseText);
	if (win!=undefined){
		win.on('refresh_store',function(event, target){
			refreshStore();
		});
	};
};

/**
 *  Создание нового значения в справочнике по форме ExtDictionary
 */
function newValue() {
	ajax.request({
		url: "{{ component.url_new }}"
		,success: renderWindow
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Редактирование значения в справочнике по форме ExtDictionary
 */
function editValue(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	
	if (!grid.getSelectionModel().hasSelection()) {
		Ext.Msg.show({
		   title:'Редактирование',
		   msg: 'Элемент не выбран!',
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
		return;
	};
	
	ajax.request({
		url: "{{ component.url_edit }}"
		,params: {
			'id': grid.getSelectionModel().getSelected().id
		}
		,success: renderWindow
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Удаление значения в справочнике по форме ExtDictionary
 */
function deleteValue(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!grid.getSelectionModel().hasSelection()) {
		Ext.Msg.show({
		   title:'Удаление',
		   msg: 'Элемент не выбран!',
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
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
					url: "{{ component.url_delete }}"
					,params: {
						'id': grid.getSelectionModel().getSelected().id
					}
					,success: renderWindow
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
function selectValue(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!grid.getSelectionModel().hasSelection()) {
		Ext.Msg.show({
		   title:'Выбор',
		   msg: 'Элемент не выбран!',
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
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
function refreshStore(){
	var search_field = Ext.getCmp("{{ component.search_text.client_id }}");
	if (search_field)
		search_field.search();
};