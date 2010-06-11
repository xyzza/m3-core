(function(){
    var result = new Ext.data.JsonStore({
    	url: '{{ component.url }}'
    	,storeId: '{{ component.client_id }}'
    	,baseParams: Ext.applyIf({
    		{% for key,value in component.base_params.items %}
    			{{ key }}: {{ value}}{% if not forloop.last %},{% endif %}			
    		{% endfor %} 		
    	},{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %})
    	,idProperty: '{{ component.id_property }}'
    	{% if component.root %} ,root: '{{ component.root }}' {% endif %}
    	{% if component.total_property %} ,totalProperty: '{{ component.total_property }}' {% endif %}
    	{% if component.auto_load %} ,autoLoad: true {% endif %}
    	,fields: [{{ component.t_render_fields|safe }}]
		{% if component.writer %} ,writer: {{ component.writer.render }} {% endif %}
    });
    return result;
})()