function(){
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "containercontextmenu" %}
			var container_contmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var tree = new Ext.ux.tree.TreeGrid({
		{% include 'base-ext-ui.js'%}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
		
	    ,useArrows: true
	    ,autoScroll: false
	    ,animate: true
	    {% if component.drag_drop %} ,enableDD: true {% endif %}
	    ,containerScroll: true
	    ,border: false
		,split: true
		,columns:[{{ component.t_render_columns|safe }}]
		,loader: {{ component.t_render_tree_loader|safe }}	
		{%if component.root_text %} ,rootVisible: true {%endif%}
		,root: new Ext.tree.AsyncTreeNode({
			id: '-1'
			{%if component.root_text %} ,text:'{{ component.root_text }}' {%endif%}
			{%if component.nodes %},children: [ {{ component.t_render_nodes|safe }} ] {%endif%}
        })
        {% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					{% if not forloop.first%},{%endif%}
				
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "contextmenu" %}
						contextmenu:
		                    function(node, e){
								node.select();
					            contmenu.contextNode = node;
					            contmenu.showAt(e.getXY());
		                    }
					{%else%}
						{% ifequal k "containercontextmenu" %}
							containercontextmenu:
			                    function(tree, e){
									e.stopEvent();
						            container_contmenu.showAt(e.getXY());
			                    }
						{%else%}
							'{{k}}': {{v|safe}}
						{% endifequal %}  
					{% endifequal %}  
			{% endfor%}
		}
		{% endif %}
	});
	
	{# Здесь может быть Ваша реклама! #}
	
	return tree;
}()

