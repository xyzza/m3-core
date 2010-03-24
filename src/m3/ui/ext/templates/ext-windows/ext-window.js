new Ext.Window({
    id: '{{ component.client_id }}'
    , width: {{ component.width }}
    , height: {{ component.height }}
    , title: '{{ component.title }}'
	{% ifnotequal component.modal '' %}, modal: {{ component.modal|lower}} {% endifnotequal %}
	{% ifnotequal component.minimizable '' %}, minimizable: {{ component.minimizable|lower}} {% endifnotequal %}
	{% ifnotequal component.maximizable '' %}, maximizable: {{ component.maximizable|lower}} {% endifnotequal %}
	{% ifnotequal component.maximized '' %}, maximized: {{ component.maximized|lower}} {% endifnotequal %}
	{% ifnotequal component.minimized '' %}, minimized: {{ component.minimized|lower}} {% endifnotequal %}
	{% ifnotequal component.closable '' %}, closable: {{ component.closable|lower }} {% endifnotequal %}

	{% if component.body_style %}, bodyStyle : '{{ component.body_style }}' {% endif %}
	
	, layout: '{{ component.layout}}'
	
    , items:[{% if component.top_container %}{{ component.top_container.render|safe }}{% endif %}]  
    {% if component.buttons %},{{ component.t_render_buttons|safe }}{% endif %}
    
		
})
