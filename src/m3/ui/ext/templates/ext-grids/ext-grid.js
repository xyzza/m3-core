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
	
	var plugins=[];
	{%if component.show_banded_columns%}
		//Плагин обработки объединенных колонок
		plugins.push( new Ext.ux.grid.ColumnHeaderGroup({
				rows: {{ component.t_render_banded_columns|safe }}
			})
		);
	{%endif%}
	{% if component.editor %}
		//Плагин редактирования таблицы
		plugins.push( new Ext.ux.grid.RowEditor({
			saveText: 'Обновить'
			,cancelText: 'Отмена'
			})
		);
	{%endif%}
	
	{% if component.sm %} var sel_model = {{ component.sm.render|safe }}; {% endif %}
	var grid_columns = [
		{% if component.checkbox_model %} sel_model, {% endif %}
		{{ component.t_render_columns|safe }}
	];
	
	var grid = new Ext.grid.GridPanel({
		id: '{{ component.client_id }}'
		{% if component.disabled %} ,disabled: true {% endif %}
		{% if component.hidden %} ,hidden: true {% endif %}
		{% if component.width %} ,width: {{ component.width }} {% endif %}
		{% if component.height %} ,height: {{ component.height }} {% endif %}
		{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
		{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
		{% if component.x %} ,x: {{ component.x }} {% endif %}
		{% if component.y %} ,y: {{ component.y }} {% endif %}
		{% if component.region %} ,region: '{{ component.region }}' {% endif %}
		{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
		{% if component.max_height %} ,boxMaxHeight: {{ component.max_height }} {% endif %}
		{% if component.min_height %} ,boxMinHeight: {{ component.min_height }} {% endif %}
		{% if component.max_width %} ,boxMaxWidth: {{ component.max_width }} {% endif %}
		{% if component.min_width %} ,boxMinWidth: {{ component.min_width }} {% endif %}
		{% if component.anchor %} ,anchor: '{{ component.anchor|safe }}' {% endif %}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	    {% if component.title %} 
	    	,title: '{{ component.title }}' 
	    	,header: true
	    {% else %}
	    	,header: false
	    {% endif %}
	    {% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.bottom_bar %} ,bbar: {{ component.t_render_bottom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	    {% if component.sm %} ,sm: sel_model {% endif %}
		,store: {{ component.t_render_store|safe }}
		,columns: grid_columns
		,stripeRows: true
		,stateful: true
		,viewConfig: {forceFit: true}
		,plugins: plugins
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

	{% if component.bottom_bar %} 
	var bbar = grid.getBottomToolbar();
	if (bbar && bbar.isXType('paging')){
		var store = grid.getStore();
		store.setBaseParam('start',0);
		store.setBaseParam('limit',bbar.pageSize);
		bbar.bind(store);
	}
	{% endif %}	

return grid;
}()