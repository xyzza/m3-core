new Ext.menu.Menu({
		id: '{{ component.client_id }}'
		{% if component.disabled %} ,disabled: true {% endif %}
		{% if component.hidden %} ,hidden: true {% endif %}
		{% if component.width %} ,width: {{ component.width }} {% endif %}
		{% if component.height %} ,height: {{ component.height }} {% endif %}
		{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
		{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
		{% if component.x %} ,x: {{ component.x }} {% endif %}
		{% if component.y %} ,y: {{ component.y }} {% endif %}
		{% if component.max_height %} ,boxMaxHeight: {{ component.max_height }} {% endif %}
		{% if component.min_height %} ,boxMinHeight: {{ component.min_height }} {% endif %}
		{% if component.max_width %} ,boxMaxWidth: {{ component.max_width }} {% endif %}
		{% if component.min_width %} ,boxMinWidth: {{ component.min_width }} {% endif %}
		{% if component.anchor %} ,anchor: '{{ component.anchor|safe }}' {% endif %}
		
		,items: [{{ component.t_render_items|safe }}]
		{# Прописываются имеющиеся обработчики #}
		{% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "beforeshow" %}
						beforeshow: {{ v|safe }}
					{% endifequal %} 
					{% if not forloop.last %},{% endif %}
			{% endfor%}
			}
		{% endif %}
})
