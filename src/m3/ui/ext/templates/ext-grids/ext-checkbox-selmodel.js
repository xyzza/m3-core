new Ext.grid.CheckboxSelectionModel({
	{% if component.singleSelect %} ,singleSelect: true {% endif %}
})