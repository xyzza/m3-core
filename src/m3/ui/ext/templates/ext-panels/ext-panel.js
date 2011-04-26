new Ext.Panel({
	{% include 'base-ext-ui.js'%}
	
	{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
	{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	{% if component.base_cls %} ,baseCls: '{{ component.base_cls }}' {% endif %}
	{% if component.body_cls %} ,bodyCfg: {cls: '{{ component.body_cls }}' } {% endif %}
	{% if component.title %} ,title: '{{ component.title }}' {% endif %}
	{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
	{% if component.bottom_bar %} ,bbar: {{ component.t_render_bottom_bar|safe }} {% endif %}
	{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	{% if component.split %} ,split: true {% endif %} 
	{% if component.collapsible %} ,collapsible: true {% endif %} 
	{% if component.padding %} ,padding: '{{ component.padding }}' {% endif %}
	{% if component.anchor %}, anchor: '{{component.anchor}}' {% endif %}
    {% if component.dd_group %}, ddGroup: '{{component.dd_group}}' {% endif %}
    , border: {{component.border|lower}}
    , bodyBorder: {{component.body_border|lower}}        
	,autoScroll: true
	,items: {{ component.t_render_items|safe }}
	{% if component.auto_load %} ,autoLoad: {{ component.auto_load|safe}} {% endif %}
	{% if component.label_align %} ,labelAlign: '{{ component.label_align }}' {% endif %}
	{% if component.label_width %} ,labelWidth: {{ component.label_width }} {% endif %}
})