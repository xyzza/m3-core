new Ext.form.Label({
	id: '{{ component.client_id|safe }}'
	{% if component.text %},fieldLabel:'{{ component.text}}'  {% endif %}   
	{% if component.hidden %},hidden:{{ component.hidden|lower }}  {% endif %}
	{% if component.disabled %},disabled:{{ component.disabled|lower }}  {% endif %}
	{% if component.height %},height:{{ component.height }}  {% endif %}
	{% if component.width %},width:{{ component.width }}  {% endif %}
	{% if component.x %},x:{{ component.x }}  {% endif %}
	{% if component.y %},y:{{ component.y }}  {% endif %}
	{% if component.icon_cls %},iconCls:'{{ component.icon_cls|safe }}'  {% endif %}
	{% if component.html %},html:'{{ component.html|safe }}'  {% endif %}
	{% if component.style %},style: {{ component.t_render_style|safe }} {% endif %}
})