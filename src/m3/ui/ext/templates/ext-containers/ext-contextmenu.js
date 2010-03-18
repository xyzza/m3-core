new Ext.menu.Menu({
		id: '{{ component.client_id }}',
		items: [{{ component.render_items|safe }}]
		{# Прописываются имеющиеся обработчики #}
		{% if component.listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.listeners.items %}
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "beforeshow" %}
						beforeshow: {{ v|safe }}
					{% endifequal %} 
					{% if not forloop.last %},{% endif %}
			{% endfor%}
			}
		{% endif %}
})
