new Ext.grid.CellSelectionModel({
	{% if component.singleSelect %} ,singleSelect: true {% endif %}
})