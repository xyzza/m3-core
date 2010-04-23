new Ext.grid.RowSelectionModel({
	{% if component.singleSelect %} ,singleSelect: true {% endif %}
})