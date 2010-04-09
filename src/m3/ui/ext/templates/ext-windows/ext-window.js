(function(){
	var win = new Ext.Window({
		id: '{{ component.client_id }}'
		{% if component.disabled %} ,disabled: true {% endif %}
		{% if component.hidden %} ,hidden: true {% endif %}
		{% if component.width %} ,width: {{ component.width }} {% endif %}
		{% if component.height %} ,height: {{ component.height }} {% endif %}
		{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
		{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
		{% if component.x %} ,x: {{ component.x }} {% endif %}
		{% if component.y %} ,y: {{ component.y }} {% endif %}
		{% if component.region %} ,region: '{{ component.region }}' {% endif %}
		{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
		{% if component.max_height %} ,boxMaxHeight: {{ component.max_height }} {% endif %}
		{% if component.min_height %} ,boxMinHeight: {{ component.min_height }} {% endif %}
		{% if component.max_width %} ,boxMaxWidth: {{ component.max_width }} {% endif %}
		{% if component.min_width %} ,boxMinWidth: {{ component.min_width }} {% endif %}
	    
	    {% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.modal %}, modal: true {% endif %}
		{% if component.maximized %}, maximized: true {% endif %}
		{% if component.minimized %}, minimized: true {% endif %}
		
		{% ifnotequal component.t_get_minimizable "None" %}
		,minimizable: {{component.t_get_minimizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_maximizable "None" %}
		,maximizable: {{component.t_get_maximizable|lower }}
		{% endifnotequal %}
		{% ifnotequal component.t_get_closable "None" %}
		,closable: {{component.t_get_closable|lower }}
		{% endifnotequal %}	
	
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.body_style %}, bodyStyle : '{{ component.body_style }}' {% endif %}
		{% if component.layout %} ,layout: '{{ component.layout}}' {% endif %}
		
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
	    ,items:[{{ component.t_render_items|safe }}]  
	    {% if component.buttons %},{{ component.t_render_buttons|safe }}{% endif %}	
	});
	
	return win;
})()