function getWindow()
{
    var window = new Ext.Window({
        id: '{{ component.client_id }}',
        width: {{ component.width }},
        height: {{ component.height }},
        title: '{{ component.title }}',
        
        items:[
        {% if component.top_container %}
            {{ component.top_container.render|safe }}            
        {% endif %}
        ]
        
        {% if component.buttons %}
            ,{{ component.render_buttons|safe }}
        {% endif %}
    });
    
    return window;
}

getWindow().show();

{% block usercode %}
{# место для вставки пользовательского кода формы #}
{% endblock %}