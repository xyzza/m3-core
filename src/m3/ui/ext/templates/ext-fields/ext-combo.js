new Ext.form.ComboBox({
	id: '{{ component.client_id }}',
	fieldLabel: "{{ component.label }}",
	store:"{{component.store}}",
	displayField:"{{component.display_field}}",
	triggerAction:'all',
	editable:false
})
