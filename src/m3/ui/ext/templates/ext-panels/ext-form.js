new Ext.FormPanel({
    title: '{{ component.title }}',
    layout: '{{ component.layout }}',
    baseCls: 'x-plain',
    {% if component.title %} 
    header: true,
    {% else %}
    header: false,
    {% endif %}
    items: [{{ component.render_items|safe }}]
})