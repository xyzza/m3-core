Ext3.getCmp('{{ component.select_dict_button.client_id }}').setHandler( function(){
    var text_field = Ext3.getCmp("{{ component.field_id }}");
    var win = Ext3.getCmp("{{ component.client_id }}");
    var grid = Ext3.getCmp("{{ component.grid.client_id }}");

	if (text_field!=undefined && win!=undefined && grid!=undefined) {
	    text_field.setValue(grid.getSelectionModel().getSelected().get('{{component.attr_id }}')); 
		text_field.reference_id = grid.getSelectionModel().getSelected().get('{{component.attr_text }}');
	    win.close();
	}
});