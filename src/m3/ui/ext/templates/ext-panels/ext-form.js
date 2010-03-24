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
    , items: [{{ component.t_render_items|safe }}]
})