new Ext.FormPanel({
	id: '{{ component.client_id }}',
    title: '{{ component.title }}'
    , layout: '{{ component.layout }}'
    , baseCls: 'x-plain'
    {% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
    {% if component.title %} 
    , header: true
    {% else %}
    , header: false
    {% endif %}
	{% if component.label_width  %}, labelWidth: {{ component.label_width }} {% endif %}
	{% if component.label_align  %}, labelAlign: '{{ component.label_align }}' {% endif %}
	{% if component.label_pad  %}, labelPad: {{ component.label_pad }} {% endif %}
    , items: [{{ component.t_render_items|safe }}]
})