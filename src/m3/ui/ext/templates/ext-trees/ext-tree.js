function(){
	{% for k, v in component.t_get_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "containercontextmenu" %}
			var container_contmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var tree = new Ext.ux.tree.TreeGrid({
		id: '{{ component.client_id}}',
	    useArrows: true,
	    autoScroll: true,
	    animate: true,
	    enableDD: true,
	    containerScroll: true,
	    border: false,
		split: true,
		title: '{{ component.title }}',
		
		columns:[{{ component.t_render_columns|safe }}],
		loader: {{ component.t_render_tree_loader|safe }},	
		root: new Ext.tree.AsyncTreeNode({
			children: [ {{ component.t_render_nodes|safe }} ]
        })
        {% if component.t_get_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_get_listeners.items %}
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "contextmenu" %}
						contextmenu:
		                    function(node, e){
								node.select();
					            contmenu.contextNode = node;
					            contmenu.showAt(e.getXY());
		                    }
					{% endifequal %}  
					{% ifequal k "containercontextmenu" %}
						containercontextmenu:
		                    function(tree, e){
								e.stopEvent();
					            container_contmenu.showAt(e.getXY());
		                    }
					{% endifequal %}  
					{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
		{% endif %}
	});
	
	{# Здесь может быть Ваша реклама! #}
	
	return tree;
}()

