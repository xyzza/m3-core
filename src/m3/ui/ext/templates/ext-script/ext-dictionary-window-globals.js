var ajax = Ext.Ajax;

/**
 * Стандартный рендеринг окна c добавлением обработчика
 */
function render_window(response, opts){
	win = eval(response.responseText);
	if (win!=undefined){
		win.on('refresh_store',function(event, target){
			var grid = Ext.getCmp('{{ component.grid.client_id}}');	
			grid.getStore().reload();
		});
	}
}

/**
 *  Создание нового значения в справочнике по форме ExtDictionary
 */
function new_value() {
	ajax.request({
		url: "{{ component.url_new }}"
		,success: render_window
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Редактирование значения в справочнике по форме ExtDictionary
 */
function edit_value(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	
	if (!grid.getSelectionModel().hasSelection()) {
		Ext.Msg.alert('','Выберите значение для редактирования');
		return;
	};
	
	ajax.request({
		url: "{{ component.url_edit }}"
		,params: {
			'id': grid.getSelectionModel().getSelected().id
		}
		,success: render_window
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Удаление значения в справочнике по форме ExtDictionary
 */
function delete_value(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	if (!grid.getSelectionModel().hasSelection()) {
		Ext.Msg.alert('','Выберите значение для удаления');
		return;
	};
	
	ajax.request({
		url: "{{ component.url_delete }}"
		,params: {
			'id': grid.getSelectionModel().getSelected().id
		}
		,success: render_window
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};

/**
 * Выбор значения в справочнике по форме ExtDictionary
 */
function select_value(){
	// var grid = Ext.getCmp('{{ component.grid.client_id}}');
	var win = Ext.getCmp('{{ component.client_id}}');
	
	// здесь должна быть обработка выбора значения, например:
	win.fireEvent('refresh_store');
};

function search(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	
	ajax.request({
		url: grid.getStore().url
		,params: {
			'filter': Ext.getCmp("{{ component.search_text.client_id }}").getValue()
		}
		,success: function(response, opts){
		    grid.getStore().loadData( Ext.decode(response.responseText) );
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
};