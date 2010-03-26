new Ext.data.Connection().request({
	id: "{{ component.client_id }}"
	,url: "{{ component.url }}"
	{% if component.method%} ,method: "{{ component.method }}" {% endif %}
	{% if component.parameters%} ,params: {{ component.parameters|safe }} {% endif %}
	,success: function(response, opts){
	   eval(response.responseText);
	}
	,failure: function(response, opts){
	   Ext.Msg.alert('','failed');
	}
})
