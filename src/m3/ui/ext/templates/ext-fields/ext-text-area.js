new Ext.form.TextArea({
	{% include 'base-ext-ui.js'%}
	{% include 'base-ext-field-ui.js'%}
	
	{% if component.mask_re %} ,maskRe: {{component.t_render_mask_re}} {% endif %}
	{% if component.t_render_listeners %}
		{# Прописываются имеющиеся обработчики #}
		,listeners:{
			{% for k, v in component.t_render_listeners.items %}
				'{{k}}': {{v|safe}}
				{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
	{% endif %}
})