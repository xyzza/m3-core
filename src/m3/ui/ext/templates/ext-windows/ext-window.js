new Ext.Window({
	id: '{{ component.client_id }}'
	{% if component.disabled %} ,disabled: true {% endif %}
	{% if component.hidden %} ,hidden: true {% endif %}
	{% if component.width %} ,width: {{ component.width }} {% endif %}
	{% if component.height %} ,height: {{ component.height }} {% endif %}
	{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
	{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
	{% if component.x %} ,x: {{ component.x }} {% endif %}
	{% if component.y %} ,y: {{ component.y }} {% endif %}
    
    {% if component.title %} ,title: '{{ component.title }}' {% endif %}
	{% if component.modal %}, modal: true {% endif %}
	{% if component.minimizable %}, minimizable: true {% endif %}
	{% if component.maximizable %}, maximizable: true {% endif %}
	{% if component.maximized %}, maximized: true {% endif %}
	{% if component.minimized %}, minimized: true {% endif %}
	,closable: {{ component.closable|lower }}

	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.body_style %}, bodyStyle : '{{ component.body_style }}' {% endif %}
	{% if component.layout %} ,layout: '{{ component.layout}}' {% endif %}
	
    ,items:[{% if component.top_container %}{{ component.top_container.render|safe }}{% endif %}]  
    {% if component.buttons %},{{ component.t_render_buttons|safe }}{% endif %}	
})
