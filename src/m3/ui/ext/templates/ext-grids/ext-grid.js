function(){
	
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "rowcontextmenu" %}
			var rowcontmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var grid = new Ext.grid.GridPanel({
		id: '{{ component.client_id }}',
	    title: '{{ component.title }}',
	
	    {% if component.title %}
	    header: true,
	    {% else %}
	    header: false,
	    {% endif %}
	    
		store: {{ component.t_render_store|safe }},
		columns: [{{ component.t_render_columns|safe }}],
		stripeRows: true,
		height: 600,
		stateful: true,
		viewConfig: {forceFit: true}
		
		{%if component.show_banded_columns%}
			//Плагин обработки объединенных колонок
			,plugins: new Ext.ux.grid.ColumnHeaderGroup({
				rows: {{ component.t_render_banded_columns|safe }}
			})
		{%endif%}
		{% if component.t_render_listeners %}
		{# Прописываются имеющиеся обработчики #}
		,listeners:{
			{% for k, v in component.t_render_listeners.items %}
				{# Здесь рендерится контекстное меню #}
				{% ifequal k "contextmenu" %}
					contextmenu:
	                    function(e){
	                    e.stopEvent();
	                    contmenu.showAt(e.getXY())
	                    }
				{% endifequal %}
				{% ifequal k "rowcontextmenu" %}
					rowcontextmenu:
	                    function(grid, index, e){
	                    e.stopEvent();
	                    this.getSelectionModel().selectRow(index);
	                    rowcontmenu.showAt(e.getXY())
	                    }
				{% endifequal %}
				  
				{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
		{% endif %}
})

return grid;
}()