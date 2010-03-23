new Ext.form.TextField({
	id: '{{ component.client_id }}'
	,name: '{{ component.name }}'
	,fieldLabel: '{{ component.label }}'
	,value: '{{ component.value }}'
	,width: '{{ component.width }}'
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
})