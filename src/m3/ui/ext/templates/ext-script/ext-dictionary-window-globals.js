var ajax = Ext.Ajax;

/**
 * Стандартный рендеринг окна c добавлением обработчика
 */
function render_window(response, opts){
	win = m3_eval(response.responseText);
	if (win!=undefined){
		win.on('refresh_store',function(event, target){
			refresh_store();
		});
	};
};

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
		Ext.Msg.show({
		   title:'Удаление',
		   msg: 'Элемент не выбран!',
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.INFO
		});
		return;
	};
	
	Ext.Msg.show({
	   title:'Удаление',
	   msg: 'Вы действительно хотите удалить элемент?',
	   buttons: Ext.Msg.YESNO,
	   icon: Ext.MessageBox.QUESTION,
	   fn:function(btn,text,opt){ 
	    	if (btn == 'no') {
	    		return;
	    	};
	   } 
	});
	
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
/**
 * Осуществляет поиск по введенному значению. Организует запрос на сервер.
 */
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

/**
 * Перезагружает хранилище данных
 */
function refresh_store(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');	
	grid.getStore().reload();
};
/**
 * Очищает введенный текст в поле поиска
 */
function clear_text(){
	var text_field = Ext.getCmp('{{ component.search_text.client_id}}');
	text_field.setValue('');
	refresh_store();
};
