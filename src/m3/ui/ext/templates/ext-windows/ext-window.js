(function(){
	var win = new Ext.Window({
		{% include 'base-ext-ui.js'%}
	    
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
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	    ,items:[{{ component.t_render_items|safe }}]  
	    {% if component.buttons %},{{ component.t_render_buttons|safe }}{% endif %}	
	    {% if not component.resizable %} ,resizable: false {% endif %}
	});
	
	return win;
})()
