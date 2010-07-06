(function () { 
	var contmenu, rowcontmenu;
	
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "rowcontextmenu" %}
			var rowcontmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}

	var sel_model;
	{% if component.sm %} sel_model = {{ component.sm.render|safe }}; {% endif %}

	var baseConf = {
		{% include 'base-ext-ui.js'%}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	    {% if component.title %} 
	    	,title: '{{ component.title }}' 
	    	,header: true
	    {% else %}
	    	,header: false
	    {% endif %}
	    {% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
		{% if component.load_mask %} ,loadMask: true {% endif %}
		,stripeRows: true
		,stateful: true
		{% if component.drag_drop %} ,enableDragDrop: true {% endif %}
		{% if component.drag_drop_group %} ,ddGroup:'{{ component.drag_drop_group }}' {% endif %}
		{% if component.master_column_id %} ,master_column_id: '{{ component.master_column_id}}' {% endif %}
		,viewConfig : { enableRowBody : true }
		{% if component.auto_expand_column %} ,autoExpandColumn: '{{ component.auto_expand_column}}' {% endif %}
		{% if component.t_render_simple_listeners %}
		,listeners: {{ component.t_render_simple_listeners|safe}}
		{%endif%}
	}

	var params = {
		storeParams: {
			url: '{{ component.url }}'
			,root: '{{ component.store_root}}'
		}
		,columnsToRecord: [{{ component.t_render_columns_to_record|safe }}]
		,selModel: sel_model
		,columns: [{{ component.t_render_columns|safe }}]
		,menus: {
			contextMenu: contmenu
			,rowContextMenu: rowcontmenu
		}
		,plugins: []
	}

	return createAdvancedTreeGrid(baseConf, params);
})()



