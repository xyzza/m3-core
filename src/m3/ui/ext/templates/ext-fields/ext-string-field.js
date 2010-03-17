new Ext.form.TextField({
	id: '{{ component.client_id }}',
	name: '{{ component.name }}',
	fieldLabel: '{{ component.label }}',
	value: '{{ component.value }}',
	width: '{{ component.width }}'
	{% if component.style %} ,style: { {{ component.render_style|safe }} } {% endif %}
	{% if component.label_style %} ,labelStyle: "{{ component.render_label_style|safe }}" {% endif %}
})