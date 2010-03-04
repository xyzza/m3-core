new Ext.Window({
    id: '{{ component.client_id }}',
    width: {{ component.width }},
    height: {{ component.height }},
    title: '{{ component.title }}',
	modal: {{ component.modal|lower}},
	minimizable: {{ component.minimizable|lower}},
	maximizable: {{ component.maximizable|lower}},
	maximized: {{ component.maximized|lower}},
	minimized: {{ component.minimized|lower}},
	
	layout: '{{ component.layout}}', 
	
    items:[{% if component.top_container %}{{ component.top_container.render|safe }}{% endif %}]  
    {% if component.buttons %},{{ component.render_buttons|safe }}{% endif %}
})
