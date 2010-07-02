{%if component.menu %}
new Ext.SplitButton({
{%else%}
new Ext.Button({
{%endif%}
	{% include 'base-ext-ui.js'%}
	
	{% if component.text %} ,text: '{{ component.text }}' {% endif %}
	{% if component.icon %} ,icon: '{{ component.icon }}' {% endif %}
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.region %} ,region: '{{ component.region }}' {% endif %}
	{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
	{% if component.tooltip_text %} ,tooltip: {{ component.t_render_tooltip|safe }} {% endif %}
	{% if component.tab_index %} ,tabIndex: {{ component.tab_index }} {% endif %}
	
	{% if component.handler %} ,handler: {{ component.t_render_handler|safe}}{% endif%}
	{% if component.menu %} ,menu: {{ component.menu.render|safe}} {% endif%}
})


