(function(){

	var search = new Ext.app.form.SearchField({
		id: '{{ component.client_id }}'
		{%if component.query_param %} ,paramName : '{{ component.query_param }}' {% endif %}
		{%if component.empty_text %} ,emptyText : '{{ component.empty_text }}' {% endif %}
		,getComponentForSearch: function(){
			return Ext.getCmp('{{ component.component_for_search.client_id }}');
		}
	});
	
	return search;
})()