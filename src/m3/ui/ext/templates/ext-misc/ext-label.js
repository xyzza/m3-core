new Ext.form.Label({
	id: '{{ component.client_id|safe }}'
	{% if component.disabled %} ,disabled: true {% endif %}
	{% if component.hidden %} ,hidden: true {% endif %}
	{% if component.width %} ,width: {{ component.width }} {% endif %}
	{% if component.height %} ,height: {{ component.height }} {% endif %}
	{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
	{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
	{% if component.x %} ,x: {{ component.x }} {% endif %}
	{% if component.y %} ,y: {{ component.y }} {% endif %}
	
	{% if component.text %},fieldLabel:'{{ component.text}}'  {% endif %}   
})